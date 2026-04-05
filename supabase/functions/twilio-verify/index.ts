import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    return respond({ error: "Twilio credentials not configured" }, 500);
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return respond({ error: "Backend credentials not configured" }, 500);
  }

  try {
    const { action, phone, code, full_name, role } = await req.json();

    if (!phone) return respond({ error: "Phone number is required" }, 400);

    const twilioAuth = "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const verifyBase = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}`;

    // ── SEND OTP ──────────────────────────────────────────────
    if (action === "send") {
      console.log(`[send] Sending OTP to ${phone}`);
      const res = await fetch(`${verifyBase}/Verifications`, {
        method: "POST",
        headers: { Authorization: twilioAuth, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: phone, Channel: "sms", CustomFriendlyName: "M-Chama" }),
      });
      const data = await res.json();
      console.log(`[send] Twilio ${res.status}:`, JSON.stringify(data));

      if (!res.ok) {
        return respond({ error: data.message || "Failed to send OTP" }, 400);
      }
      return respond({ success: true, status: data.status });
    }

    // ── VERIFY OTP ────────────────────────────────────────────
    if (action === "verify") {
      if (!code) return respond({ error: "OTP code is required" }, 400);

      console.log(`[verify] Checking OTP for ${phone}`);
      const res = await fetch(`${verifyBase}/VerificationCheck`, {
        method: "POST",
        headers: { Authorization: twilioAuth, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: phone, Code: code }),
      });
      const data = await res.json();
      console.log(`[verify] Twilio ${res.status}:`, JSON.stringify(data));

      if (!res.ok) {
        return respond({
          error: data.message || "Verification request failed",
          twilio_code: data.code,
        }, 400);
      }

      if (data.status !== "approved") {
        return respond({ success: false, error: "Invalid OTP code" }, 400);
      }

      // ── OTP approved → create / find Supabase user ─────────
      console.log(`[verify] OTP approved for ${phone}. Resolving user…`);

      const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Synthetic email so Supabase has an identifier we can use for session
      const syntheticEmail = `${phone.replace(/\+/g, "")}@phone.mchama.app`;

      // Try to find user by phone
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      let user = users?.users?.find((u) => u.phone === phone);

      if (!user) {
        // Also check by synthetic email
        user = users?.users?.find((u) => u.email === syntheticEmail);
      }

      if (!user) {
        // Create new user
        console.log("[verify] Creating new user");
        const { data: created, error: createErr } =
          await supabaseAdmin.auth.admin.createUser({
            phone,
            phone_confirm: true,
            email: syntheticEmail,
            email_confirm: true,
            user_metadata: {
              full_name: full_name || "",
              phone,
              role: role || "member",
            },
          });

        if (createErr) {
          console.error("[verify] Create user error:", createErr.message);
          return respond({ error: createErr.message }, 500);
        }
        user = created.user;
        console.log("[verify] Created user:", user.id);
      } else {
        console.log("[verify] Found existing user:", user.id);
        // Phone already confirmed via OTP verification
      }

      // Generate a magic link to create a session
      const { data: linkData, error: linkErr } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: syntheticEmail,
        });

      if (linkErr || !linkData) {
        console.error("[verify] generateLink error:", linkErr?.message);
        return respond({
          success: true,
          verified: true,
          error: "Session creation failed. Please try again.",
        }, 500);
      }

      // Return the hashed token so the frontend can exchange it for a session
      return respond({
        success: true,
        verified: true,
        token_hash: linkData.properties.hashed_token,
        email: syntheticEmail,
      });
    }

    return respond({ error: "Invalid action. Use 'send' or 'verify'" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[error]", msg);
    return respond({ error: msg }, 500);
  }
});
