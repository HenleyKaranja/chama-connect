import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Phone, Lock, Mail } from "lucide-react";
import logoImg from "/logo.png";
import { motion } from "framer-motion";
import { toast } from "sonner";

const formatPhone = (raw: string) => {
  let cleaned = raw.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("0")) cleaned = "+254" + cleaned.slice(1);
  else if (cleaned.startsWith("254")) cleaned = "+" + cleaned;
  else if (!cleaned.startsWith("+")) cleaned = "+254" + cleaned;
  return cleaned;
};

type AuthMethod = "otp" | "password";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");

  // Shared fields
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("member");
  const [loading, setLoading] = useState(false);

  // OTP fields
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(searchParams.get("mode") !== "signup");
    setOtpSent(false);
    setOtp("");
    setForgotMode(false);
  }, [searchParams]);

  // ── OTP handlers ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { toast.error("Phone number is required"); return; }
    if (!isLogin && !fullName.trim()) { toast.error("Full name is required"); return; }
    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      const { data, error } = await supabase.functions.invoke("twilio-verify", {
        body: { action: "send", phone: formattedPhone },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to send OTP");
      setOtpSent(true);
      toast.success("OTP sent to your phone!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { toast.error("Please enter the OTP"); return; }
    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      const { data, error } = await supabase.functions.invoke("twilio-verify", {
        body: {
          action: "verify",
          phone: formattedPhone,
          code: otp,
          full_name: isLogin ? undefined : fullName,
          role: isLogin ? undefined : role,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Verification failed");
      if (data.token_hash && data.email) {
        const { error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });
        if (sessionError) throw sessionError;
      }
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Password handlers ──
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Email is required"); return; }
    if (!password.trim() || password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!isLogin && !fullName.trim()) { toast.error("Full name is required"); return; }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone: phone || undefined, role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter your email address"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email!");
      setForgotMode(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setOtpSent(false);
    setOtp("");
    setForgotMode(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="text-center mb-6">
          <img src={logoImg} alt="M-Chama" className="h-16 w-16 rounded-xl object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold tracking-tight">M-Chama</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {forgotMode
              ? "Reset your password"
              : isLogin
              ? "Sign in to your account"
              : "Create your account"}
          </p>
        </div>

        {/* Auth method toggle */}
        {!forgotMode && (
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => setAuthMethod("password")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
                authMethod === "password"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              Password
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod("otp"); setOtpSent(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
                authMethod === "otp"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              Phone OTP
            </button>
          </div>
        )}

        {/* ── Forgot password ── */}
        {forgotMode ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">We'll send a reset link to your email</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to sign in
            </button>
          </form>
        ) : authMethod === "password" ? (
          /* ── Password flow ── */
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pw-name">Full Name</Label>
                  <Input id="pw-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Amina Wanjiku" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-phone">Phone (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="pw-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="pw-role"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin / Chairperson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="pw-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="pw-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw-pass">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="pw-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="pl-10" required />
              </div>
            </div>
            {isLogin && (
              <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline">
                Forgot password?
              </button>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (isLogin ? "Signing in..." : "Creating account...") : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
        ) : (
          /* ── OTP flow ── */
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Amina Wanjiku" required={!isLogin} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin / Chairperson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className="pl-10" required />
                </div>
                <p className="text-xs text-muted-foreground">We'll send a one-time code via SMS</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  OTP sent to <span className="font-semibold text-foreground">{formatPhone(phone)}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP Code</Label>
                <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} className="text-center text-lg tracking-widest font-semibold" required autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Sign In"}
              </Button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Change phone number
              </button>
            </form>
          )
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={switchMode} className="text-primary font-medium hover:underline">
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
