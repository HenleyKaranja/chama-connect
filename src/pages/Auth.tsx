import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { Landmark, ArrowLeft, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatKenyanNumber } from "@/lib/auth-utils";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("member");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(searchParams.get("mode") !== "signup");
    setOtpSent(false);
    setOtp("");
  }, [searchParams]);

  // Format phone to E.164 (Kenya)
  const formatPhone = (raw: string) => {
    let cleaned = raw.replace(/\s+/g, "").replace(/-/g, "");
    if (cleaned.startsWith("0")) cleaned = "+254" + cleaned.slice(1);
    else if (cleaned.startsWith("254")) cleaned = "+" + cleaned;
    else if (!cleaned.startsWith("+")) cleaned = "+254" + cleaned;
    return cleaned;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
        if (error) throw error;
      } else {
        if (!fullName.trim()) {
          toast.error("Full name is required");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: {
            data: { full_name: fullName, phone: formattedPhone, role },
          },
        });
        if (error) throw error;
      }
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
    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
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

        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
            <Landmark className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">M-Chama</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Sign in with your phone" : "Create your account"}
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Amina Wanjiku"
                    required={!isLogin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
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
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="pl-10"
                  required
                />
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
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-widest font-semibold"
                required
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Button>

            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Change phone number
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setOtpSent(false); setOtp(""); }}
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
