import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
    console.error("Missing Twilio credentials");
    return new Response(
      JSON.stringify({ error: "Twilio credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase credentials");
    return new Response(
      JSON.stringify({ error: "Supabase credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { action, phone, code, full_name, role } = body;

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const baseUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}`;

    // ── SEND OTP ──
    if (action === "send") {
      console.log(`Sending OTP to ${phone} via service ${TWILIO_VERIFY_SID}`);

      const response = await fetch(`${baseUrl}/Verifications`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Channel: "sms" }),
      });

      const data = await response.json();
      console.log("Twilio send response:", JSON.stringify(data));

      if (!response.ok) {
        console.error(`Twilio send error [${response.status}]:`, JSON.stringify(data));
        return new Response(
          JSON.stringify({ error: data.message || "Failed to send OTP" }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, status: data.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── VERIFY OTP ──
    if (action === "verify") {
      if (!code) {
        return new Response(
          JSON.stringify({ error: "OTP code is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Verifying OTP for ${phone} via service ${TWILIO_VERIFY_SID}`);
      const verifyUrl = `${baseUrl}/VerificationChecks`;
      console.log("Twilio verify URL:", verifyUrl);

      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Code: code }),
      });

      const data = await response.json();
      console.log("Twilio verify response:", JSON.stringify(data));

      if (!response.ok) {
        console.error(`Twilio verify error [${response.status}]:`, JSON.stringify(data));
        return new Response(
          JSON.stringify({
            error: data.message || "Verification failed",
            twilio_status: response.status,
            twilio_code: data.code,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (data.status !== "approved") {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid OTP code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // OTP approved — now create or sign in the user via Supabase Admin API
      console.log(`OTP approved for ${phone}. Creating/signing in user...`);

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Check if user with this phone already exists
      const { data: existingUsers, error: listError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error("Error listing users:", listError.message);
        return new Response(
          JSON.stringify({ error: "Failed to look up user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let userId: string | null = null;
      const existingUser = existingUsers.users.find((u) => u.phone === phone);

      if (existingUser) {
        userId = existingUser.id;
        console.log(`Found existing user: ${userId}`);
      } else {
        // Create new user
        const metadata: Record<string, string> = {
          phone,
          phone_verified: "true",
        };
        if (full_name) metadata.full_name = full_name;
        if (role) metadata.role = role;

        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            phone,
            phone_confirm: true,
            user_metadata: metadata,
          });

        if (createError) {
          console.error("Error creating user:", createError.message);
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userId = newUser.user.id;
        console.log(`Created new user: ${userId}`);
      }

      // Generate a magic link / session for the user
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: `${phone.replace("+", "")}@phone.mchama.app`,
        });

      // Alternative: just return the user ID and let frontend set session
      // For now, generate an OTP-based session directly
      // We'll use signInWithPassword by setting a random password, or use the admin API

      // Simplest approach: use admin.generateLink won't work for phone-only users
      // Instead, let's sign them in by creating a session via the admin API
      // The admin API doesn't have a direct "create session" — but we can use
      // supabase.auth.admin.generateLink with a phone user workaround

      // Best approach for phone auth: update the user's phone_confirmed and use
      // the Supabase phone OTP internally
      const { data: otpData, error: otpError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: `phone_${phone.replace(/\+/g, "")}@mchama.local`,
        });

      // Since generateLink doesn't work well for phone-only, let's use a different approach:
      // Sign the user in with a custom access token
      // Actually, the cleanest way is to use signInWithIdToken or create a verified session

      // Let's use the approach of updating user email and generating link
      // OR simply return success and have the frontend use signInWithOtp with Supabase
      // But that requires Supabase phone provider...

      // CLEANEST APPROACH: Create a short-lived sign-in token
      // We'll add a dummy email to the user and use magic link
      const dummyEmail = `phone_${phone.replace(/\+/g, "")}@mchama.local`;

      // Update user to have a dummy email for session generation
      await supabaseAdmin.auth.admin.updateUser(userId!, {
        email: dummyEmail,
        email_confirm: true,
      });

      // Now generate a magic link for this email
      const { data: magicData, error: magicError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: dummyEmail,
        });

      if (magicError || !magicData) {
        console.error("Error generating session link:", magicError?.message);
        // Fallback: return user ID so frontend knows auth succeeded
        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            userId,
            message: "OTP verified but session creation failed. Please try logging in again.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract the token from the magic link
      const linkUrl = new URL(magicData.properties.hashed_token ? 
        `${SUPABASE_URL}/auth/v1/verify?token=${magicData.properties.hashed_token}&type=magiclink` :
        magicData.properties.action_link);
      
      console.log("Session generation successful for user:", userId);

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          userId,
          // Return the verification token so frontend can exchange it
          action_link: magicData.properties.action_link,
          hashed_token: magicData.properties.hashed_token,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'send' or 'verify'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Edge function error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
