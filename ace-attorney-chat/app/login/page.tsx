"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Check your email to confirm your account, then log in.");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }
    setLoading(false);
  };

  const handleAppleLogin = async () => {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh px-6 select-none"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.5em] font-medium mb-1" style={{ color: "var(--accent)" }}>
            ACE ATTORNEY
          </p>
          <h1 className="text-2xl font-semibold text-white">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            {isSignUp ? "Sign up to track your record" : "Sign in to continue"}
          </p>
        </div>

        {/* Apple Sign-In */}
        <button
          onClick={handleAppleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-medium
                     transition-all duration-150 hover:bg-white/[0.08] active:scale-[0.98] cursor-pointer mb-4"
          style={{ background: "white", color: "#000" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3 text-sm border outline-none
                       placeholder:text-[var(--text-muted)] transition-colors duration-150"
            style={{ background: "var(--bg-light)", borderColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl px-4 py-3 text-sm border outline-none
                       placeholder:text-[var(--text-muted)] transition-colors duration-150"
            style={{ background: "var(--bg-light)", borderColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold tracking-wide
                       transition-all duration-200 hover:brightness-110 active:scale-[0.98]
                       cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        {/* Error / Success */}
        {error && (
          <p className="text-xs text-center mt-3" style={{ color: "var(--primary)" }}>{error}</p>
        )}
        {message && (
          <p className="text-xs text-center mt-3" style={{ color: "var(--take-that)" }}>{message}</p>
        )}

        {/* Toggle */}
        <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
          {isSignUp ? "Already have an account?" : "Don\u2019t have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
            className="cursor-pointer underline"
            style={{ color: "var(--text-secondary)" }}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-xs cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            Continue without account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
