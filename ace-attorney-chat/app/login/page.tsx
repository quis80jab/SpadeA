"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/src/lib/supabase/client";

type Mode = "idle" | "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    if (mode !== "idle" && emailRef.current) {
      setTimeout(() => emailRef.current?.focus(), 350);
    }
  }, [mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don\u2019t match.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
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
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setMessage(null);
  };

  const isExpanded = mode !== "idle";
  const isSignup = mode === "signup";

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh px-6 select-none"
      style={{ background: "var(--bg)" }}
    >
      {/* Back to home (always visible) */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 text-xs cursor-pointer px-3.5 py-1.5 rounded-full border hover:bg-white/5 transition-all"
        style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1 -mt-0.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Home
      </motion.button>

      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <p className="text-[10px] tracking-[0.5em] font-medium mb-1" style={{ color: "var(--accent)" }}>
          ACE ATTORNEY
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          AI Courtroom
        </h1>
      </motion.div>

      {/* Auth Card Container */}
      <motion.div
        layout
        className="w-full max-w-sm"
        transition={{ layout: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ─── Idle: two pill buttons ─── */
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                onClick={() => switchMode("login")}
                className="w-full py-3 rounded-full text-sm font-semibold tracking-wide cursor-pointer
                           transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "var(--text-primary)",
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode("signup")}
                className="w-full py-3 rounded-full text-sm font-semibold tracking-wide cursor-pointer
                           transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: "var(--primary)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(255, 56, 92, 0.25)",
                }}
              >
                Create Account
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-xs cursor-pointer mt-2"
                style={{ color: "var(--text-muted)" }}
              >
                Continue without account
              </button>
            </motion.div>
          ) : (
            /* ─── Expanded: login/signup card ─── */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-light)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
              }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {isSignup ? "Create Account" : "Welcome Back"}
                </h2>
                <button
                  onClick={() => switchMode("idle")}
                  className="p-1.5 -m-1 rounded-full hover:bg-white/5 cursor-pointer transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>

              {/* Apple Sign-In */}
              <button
                onClick={handleAppleLogin}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-medium
                           transition-all duration-150 active:scale-[0.98] cursor-pointer mb-4"
                style={{ background: "white", color: "#000" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-2.5">
                {/* Display Name (signup only) */}
                <AnimatePresence>
                  {isSignup && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-[16px] border outline-none
                                   placeholder:text-[var(--text-muted)] transition-colors duration-150 mb-2.5"
                        style={{ background: "var(--bg)", borderColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  ref={emailRef}
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl px-4 py-3 text-[16px] border outline-none
                             placeholder:text-[var(--text-muted)] transition-colors duration-150"
                  style={{ background: "var(--bg)", borderColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl px-4 py-3 text-[16px] border outline-none
                             placeholder:text-[var(--text-muted)] transition-colors duration-150"
                  style={{ background: "var(--bg)", borderColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
                />

                {/* Confirm password (signup only) */}
                <AnimatePresence>
                  {isSignup && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full rounded-xl px-4 py-3 text-[16px] border outline-none
                                   placeholder:text-[var(--text-muted)] transition-colors duration-150"
                        style={{ background: "var(--bg)", borderColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold tracking-wide mt-1
                             transition-all duration-200 hover:brightness-110 active:scale-[0.98]
                             cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--primary)" }}
                >
                  {loading ? "..." : isSignup ? "Create Account" : "Sign In"}
                </button>
              </form>

              {/* Error / Success */}
              {error && (
                <p className="text-xs text-center mt-3" style={{ color: "var(--primary)" }}>{error}</p>
              )}
              {message && (
                <p className="text-xs text-center mt-3" style={{ color: "var(--take-that)" }}>{message}</p>
              )}

              {/* Mode toggle */}
              <p className="text-xs text-center mt-4" style={{ color: "var(--text-muted)" }}>
                {isSignup ? "Already have an account?" : "Don\u2019t have an account?"}{" "}
                <button
                  onClick={() => switchMode(isSignup ? "login" : "signup")}
                  className="cursor-pointer underline"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {isSignup ? "Sign in" : "Sign up"}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
