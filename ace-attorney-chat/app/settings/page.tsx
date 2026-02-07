"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const [error, setError] = useState<string | null>(null);

  // Username uniqueness
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [checkingName, setCheckingName] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Theme & privacy local state for instant UI feedback
  const [theme, setThemeLocal] = useState<"dark" | "light">("dark");
  const [publicByDefault, setPublicByDefault] = useState(true);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
        setThemeLocal(p.theme || "dark");
        setPublicByDefault(p.arguments_public_by_default);
        setAvatarUrl(p.avatar_url || null);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check username availability with debounce
  const checkNameAvailability = useCallback(
    (name: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!name.trim() || name.trim() === profile?.display_name) {
        setNameAvailable(null);
        setCheckingName(false);
        return;
      }
      setCheckingName(true);
      debounceRef.current = setTimeout(async () => {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("display_name", name.trim())
          .neq("id", profile?.id ?? "")
          .limit(1);
        setNameAvailable(!data || data.length === 0);
        setCheckingName(false);
      }, 500);
    },
    [profile, supabase]
  );

  const handleNameChange = (val: string) => {
    setDisplayName(val);
    checkNameAvailability(val);
  };

  // Apply theme immediately and persist
  const handleThemeToggle = (t: "dark" | "light") => {
    setThemeLocal(t);
    // Apply to DOM immediately
    if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("ace_theme", t);
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);
    setError(null);

    try {
      const ext = file.name.split(".").pop();
      const filePath = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        setError("Avatar upload failed. Storage bucket may not be configured.");
        setUploadingAvatar(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + "?t=" + Date.now();
      setAvatarUrl(publicUrl);

      // Save to profile immediately
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
    } catch {
      setError("Failed to upload avatar.");
    }
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    if (!profile || saving) return;

    // Check name uniqueness if changed
    const trimmedName = displayName.trim() || profile.display_name;
    if (trimmedName !== profile.display_name && nameAvailable === false) {
      setError("That display name is already taken.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedName,
        arguments_public_by_default: publicByDefault,
        theme: theme,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError("Failed to save. Please try again.");
      setSaving(false);
      return;
    }

    // Update local profile state
    setProfile({
      ...profile,
      display_name: trimmedName,
      arguments_public_by_default: publicByDefault,
      theme: theme,
    });

    // Apply theme to DOM
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("ace_theme", theme);

    setSaving(false);
    setSaved(true);
    setNameAvailable(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    document.documentElement.classList.remove("light");
    localStorage.removeItem("ace_theme");
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-dvh"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{
            borderColor: "var(--primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col h-dvh" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => router.push("/profile")}
          className="text-sm px-3.5 py-1.5 rounded-full border cursor-pointer hover:bg-white/5 transition-all duration-150"
          style={{
            borderColor: "var(--chip-border)",
            color: "var(--text-secondary)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="inline mr-1 -mt-0.5"
          >
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
        <h1 className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-6 flex flex-col gap-6 max-w-lg mx-auto"
        >
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group transition-all duration-200"
              style={{
                background: "var(--bg-card)",
                border: "2px solid rgba(255,255,255,0.1)",
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-semibold" style={{ color: "var(--primary)" }}>
                  {(displayName ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path
                    d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div
                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{
                      borderColor: "white",
                      borderTopColor: "transparent",
                    }}
                  />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <p
              className="text-xs cursor-pointer hover:underline"
              style={{ color: "var(--text-muted)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? "Change photo" : "Add profile photo"}
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label
              className="text-xs font-medium tracking-wider uppercase block mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm border outline-none
                         placeholder:text-[var(--text-muted)] transition-colors duration-150"
              style={{
                background: "var(--bg-light)",
                borderColor:
                  nameAvailable === false
                    ? "var(--primary)"
                    : nameAvailable === true
                    ? "var(--take-that)"
                    : "rgba(255,255,255,0.08)",
                color: "var(--text-primary)",
              }}
            />
            {checkingName && (
              <p
                className="text-[11px] mt-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Checking availability...
              </p>
            )}
            {!checkingName && nameAvailable === false && (
              <p
                className="text-[11px] mt-1.5"
                style={{ color: "var(--primary)" }}
              >
                This name is already taken.
              </p>
            )}
            {!checkingName && nameAvailable === true && (
              <p
                className="text-[11px] mt-1.5"
                style={{ color: "var(--take-that)" }}
              >
                Name is available.
              </p>
            )}
          </div>

          {/* Theme */}
          <div>
            <label
              className="text-xs font-medium tracking-wider uppercase block mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Theme
            </label>
            <div className="flex gap-2">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeToggle(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
                  style={{
                    background:
                      theme === t
                        ? "rgba(255,255,255,0.1)"
                        : "var(--bg-light)",
                    color:
                      theme === t
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    border:
                      theme === t
                        ? "1px solid rgba(255,255,255,0.15)"
                        : "1px solid transparent",
                  }}
                >
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Default */}
          <div>
            <label
              className="text-xs font-medium tracking-wider uppercase block mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Default Argument Privacy
            </label>
            <div className="flex gap-2">
              {[
                { value: true, label: "Public" },
                { value: false, label: "Private" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setPublicByDefault(opt.value)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
                  style={{
                    background:
                      publicByDefault === opt.value
                        ? "rgba(255,255,255,0.1)"
                        : "var(--bg-light)",
                    color:
                      publicByDefault === opt.value
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    border:
                      publicByDefault === opt.value
                        ? "1px solid rgba(255,255,255,0.15)"
                        : "1px solid transparent",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p
              className="text-[11px] mt-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Public arguments can be shared and appear on your profile.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-center" style={{ color: "var(--primary)" }}>
              {error}
            </p>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || (nameAvailable === false)}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold tracking-wide
                       transition-all duration-200 hover:brightness-110 active:scale-[0.98]
                       cursor-pointer disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </button>

          {/* Divider */}
          <div
            className="h-px"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer hover:bg-white/5"
            style={{
              color: "var(--primary)",
              border: "1px solid rgba(255,56,92,0.2)",
            }}
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
