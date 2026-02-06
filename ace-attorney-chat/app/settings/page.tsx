"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/src/lib/supabase/client";
import type { UserProfile } from "@/src/state/types";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as unknown as UserProfile;
        setProfile(p);
        setDisplayName(p.display_name);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!profile || saving) return;
    setSaving(true);
    setSaved(false);

    await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || profile.display_name,
        arguments_public_by_default: profile.arguments_public_by_default,
        theme: profile.theme,
      })
      .eq("id", profile.id);

    // Apply theme
    document.documentElement.classList.toggle("light", profile.theme === "light");

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh" style={{ background: "var(--bg)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col h-dvh" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => router.push("/profile")}
          className="text-sm px-3.5 py-1.5 rounded-full border cursor-pointer hover:bg-white/5 transition-all duration-150"
          style={{ borderColor: "var(--chip-border)", color: "var(--text-secondary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1 -mt-0.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <h1 className="text-sm font-medium text-white flex-1">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-6 flex flex-col gap-6"
        >
          {/* Display Name */}
          <div>
            <label className="text-xs font-medium tracking-wider uppercase block mb-2" style={{ color: "var(--text-muted)" }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm border outline-none
                         placeholder:text-[var(--text-muted)] transition-colors duration-150"
              style={{ background: "var(--bg-light)", borderColor: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Theme */}
          <div>
            <label className="text-xs font-medium tracking-wider uppercase block mb-2" style={{ color: "var(--text-muted)" }}>
              Theme
            </label>
            <div className="flex gap-2">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setProfile({ ...profile, theme: t })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
                  style={{
                    background: profile.theme === t ? "rgba(255,255,255,0.1)" : "var(--bg-light)",
                    color: profile.theme === t ? "var(--text-primary)" : "var(--text-muted)",
                    border: profile.theme === t ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                  }}
                >
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Default */}
          <div>
            <label className="text-xs font-medium tracking-wider uppercase block mb-2" style={{ color: "var(--text-muted)" }}>
              Default Argument Privacy
            </label>
            <div className="flex gap-2">
              {[
                { value: true, label: "Public" },
                { value: false, label: "Private" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setProfile({ ...profile, arguments_public_by_default: opt.value })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
                  style={{
                    background: profile.arguments_public_by_default === opt.value ? "rgba(255,255,255,0.1)" : "var(--bg-light)",
                    color: profile.arguments_public_by_default === opt.value ? "var(--text-primary)" : "var(--text-muted)",
                    border: profile.arguments_public_by_default === opt.value ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
              Public arguments can be shared and appear on your profile.
            </p>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold tracking-wide
                       transition-all duration-200 hover:brightness-110 active:scale-[0.98]
                       cursor-pointer disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </button>

          {/* Divider */}
          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer hover:bg-white/5"
            style={{ color: "var(--primary)", border: "1px solid rgba(255,56,92,0.2)" }}
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
