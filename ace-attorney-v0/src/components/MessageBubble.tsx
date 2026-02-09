"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "@/src/state/types";

interface MessageBubbleProps {
  message: Message;
  /** If viewing a saved argument, pass its ID for deep-link sharing */
  argumentId?: string;
  /** Whether the argument is currently public */
  isPublic?: boolean;
  /** Callback to make a private argument public (returns after Supabase update) */
  onMakePublic?: () => Promise<void>;
  /** Highlight this bubble (for deep-link scroll target) */
  highlighted?: boolean;
}

const SITE_URL = "spadeattorney.netlify.app";
const LONG_PRESS_MS = 500;

export function MessageBubble({
  message,
  argumentId,
  isPublic,
  onMakePublic,
  highlighted,
}: MessageBubbleProps) {
  const isAttorney = message.sender === "attorney";
  const intensity = message.intensity ?? 1;
  const scale = intensity >= 4 ? 1 + (intensity - 4) * 0.008 : 1;

  const bubbleRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showPrivacyPrompt, setShowPrivacyPrompt] = useState(false);
  const [makingPublic, setMakingPublic] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = () => setShowMenu(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [showMenu]);

  const openMenu = useCallback(
    (clientX: number, clientY: number) => {
      setMenuPos({ x: clientX, y: clientY });
      setShowMenu(true);
    },
    []
  );

  // Pointer-based long press
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const { clientX, clientY } = e;
      pressTimerRef.current = setTimeout(() => {
        openMenu(clientX, clientY);
      }, LONG_PRESS_MS);
    },
    [openMenu]
  );

  const handlePointerUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handlePointerCancel = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      openMenu(e.clientX, e.clientY);
    },
    [openMenu]
  );

  // ─── Save / share image with watermark ───
  const handleDownloadImage = useCallback(async () => {
    if (!wrapperRef.current || downloading) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;

      // Resolve CSS variable colours from live DOM
      const rootStyles = getComputedStyle(document.documentElement);
      const pageBg = rootStyles.getPropertyValue("--bg").trim() || "#111111";

      const bubbleEl = bubbleRef.current;
      const bubbleComputed = bubbleEl ? getComputedStyle(bubbleEl) : null;
      const bubbleBg = bubbleComputed?.backgroundColor ?? "rgba(45,30,65,0.45)";
      const bubbleColor = bubbleComputed?.color ?? "#ffffff";
      const labelEl = wrapperRef.current.querySelector("span");
      const labelColor = labelEl ? getComputedStyle(labelEl).color : "var(--primary)";

      // Fixed export width so text reflows consistently regardless of screen size
      const EXPORT_WIDTH = 420;

      // Build offscreen card: label → bubble → watermark
      const outer = document.createElement("div");
      outer.style.cssText = `
        position: fixed; left: -9999px; top: 0;
        width: ${EXPORT_WIDTH}px;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      // Top area (label + bubble)
      const card = document.createElement("div");
      card.style.cssText = `
        padding: 24px;
        background: ${pageBg};
        border-radius: 16px 16px 0 0;
        overflow-wrap: break-word; word-break: break-word;
      `;

      // Sender label
      const label = document.createElement("div");
      label.style.cssText = `
        font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
        margin-bottom: 6px; color: ${labelColor};
      `;
      label.textContent = isAttorney ? "PROSECUTION" : "YOU";
      card.appendChild(label);

      // Bubble
      const bubble = document.createElement("div");
      bubble.style.cssText = `
        background: ${bubbleBg};
        border-radius: 16px;
        ${isAttorney ? "border-top-left-radius: 6px;" : "border-top-right-radius: 6px;"}
        padding: 14px 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      `;
      const textP = document.createElement("p");
      textP.style.cssText = `
        font-size: 15px; line-height: 1.6;
        color: ${bubbleColor};
        white-space: pre-wrap; margin: 0;
      `;
      textP.textContent = message.text;
      bubble.appendChild(textP);
      card.appendChild(bubble);

      // Watermark bar
      const watermark = document.createElement("div");
      watermark.style.cssText = `
        background: #ffffff;
        padding: 10px 24px;
        border-radius: 0 0 16px 16px;
        text-align: center;
        font-size: 11px; font-weight: 500;
        color: #555555; letter-spacing: 0.04em;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      watermark.textContent = SITE_URL;

      outer.appendChild(card);
      outer.appendChild(watermark);
      document.body.appendChild(outer);

      const canvas = await html2canvas(outer, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      document.body.removeChild(outer);

      // Convert canvas → Blob → try native share (saves to camera roll on iOS)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );

      if (blob) {
        const file = new File([blob], `ace-attorney-${Date.now()}.png`, { type: "image/png" });

        // Prefer share sheet (camera roll / AirDrop / Messages on iOS)
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file] });
          } catch {
            // User cancelled share — no-op
          }
        } else {
          // Desktop fallback — regular download
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = file.name;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch {
      // Silent fail
    }

    setDownloading(false);
    setShowMenu(false);
  }, [downloading, isAttorney, message.text]);

  // ─── Copy text ───
  const handleCopyText = useCallback(async () => {
    setCopying(true);
    await navigator.clipboard.writeText(message.text);
    setTimeout(() => {
      setCopying(false);
      setShowMenu(false);
    }, 600);
  }, [message.text]);

  // ─── Share link with privacy check ───
  const handleShareLink = useCallback(async () => {
    // If we have an argumentId, generate a deep link
    if (argumentId) {
      // Check privacy first
      if (isPublic === false && onMakePublic) {
        // Show privacy prompt
        setShowMenu(false);
        setShowPrivacyPrompt(true);
        return;
      }
      // Generate deep link
      const deepLink = `https://${SITE_URL}/a/${argumentId}?m=${message.id}`;
      if (navigator.share) {
        try {
          await navigator.share({ text: `Check out this courtroom argument`, url: deepLink });
        } catch {
          // User cancelled
        }
      } else {
        await navigator.clipboard.writeText(deepLink);
      }
    } else {
      // Fallback: share text only (game in progress, no saved argument)
      const shareText = `"${message.text.slice(0, 200)}${message.text.length > 200 ? "..." : ""}" — ${SITE_URL}`;
      if (navigator.share) {
        try {
          await navigator.share({ text: shareText, url: `https://${SITE_URL}` });
        } catch {
          // User cancelled
        }
      } else {
        await navigator.clipboard.writeText(shareText);
      }
    }
    setShowMenu(false);
  }, [message.text, message.id, argumentId, isPublic, onMakePublic]);

  // ─── Handle "Make Public and Share" from privacy prompt ───
  const handleMakePublicAndShare = useCallback(async () => {
    if (!onMakePublic || !argumentId) return;
    setMakingPublic(true);
    try {
      await onMakePublic();
      // Now generate and share the link
      const deepLink = `https://${SITE_URL}/a/${argumentId}?m=${message.id}`;
      if (navigator.share) {
        try {
          await navigator.share({ text: `Check out this courtroom argument`, url: deepLink });
        } catch {
          // User cancelled
        }
      } else {
        await navigator.clipboard.writeText(deepLink);
      }
    } catch {
      // Failed to make public
    }
    setMakingPublic(false);
    setShowPrivacyPrompt(false);
  }, [onMakePublic, argumentId, message.id]);

  return (
    <>
      <motion.div
        ref={wrapperRef}
        id={`msg-${message.id}`}
        initial={
          isAttorney
            ? intensity >= 7
              ? { opacity: 0, scale: 0.9 }
              : { opacity: 0, x: -20 }
            : { opacity: 0, x: 20 }
        }
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{
          duration: intensity >= 7 ? 0.4 : 0.3,
          type: intensity >= 7 ? "spring" : "tween",
        }}
        className={`flex flex-col max-w-[82%] my-1.5 px-5 ${
          isAttorney ? "self-start" : "self-end"
        } ${highlighted ? "msg-highlight" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={handleContextMenu}
        style={{ touchAction: "auto", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
      >
        <span
          className={`text-[10px] font-medium tracking-wider mb-1 ${
            isAttorney ? "text-left" : "text-right"
          }`}
          style={{ color: isAttorney ? "var(--primary)" : "var(--accent)" }}
        >
          {isAttorney ? "PROSECUTION" : "YOU"}
        </span>

        <div
          ref={bubbleRef}
          className={`rounded-2xl px-4 py-3.5 ${
            isAttorney ? "rounded-tl-md" : "rounded-tr-md"
          }`}
          style={{
            background: isAttorney
              ? "var(--attorney-bubble)"
              : "var(--user-bubble)",
            transform: `scale(${scale})`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          <p
            className="text-[15px] leading-relaxed whitespace-pre-wrap"
            style={{
              color: isAttorney
                ? "var(--attorney-text)"
                : "var(--user-text)",
            }}
          >
            {message.text}
          </p>
        </div>
      </motion.div>

      {/* Share Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[300] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              left: Math.min(menuPos.x, (typeof window !== "undefined" ? window.innerWidth : 400) - 200),
              top: Math.min(menuPos.y - 10, (typeof window !== "undefined" ? window.innerHeight : 800) - 200),
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              minWidth: 180,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDownloadImage}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors cursor-pointer"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-overlay)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/>
              </svg>
              {downloading ? "Saving..." : "Save as Image"}
            </button>
            <div className="h-px" style={{ background: "var(--border-subtle)" }} />
            <button
              onClick={handleShareLink}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors cursor-pointer"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-overlay)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeLinecap="round"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeLinecap="round"/>
              </svg>
              {argumentId ? "Share Link" : "Share"}
            </button>
            <div className="h-px" style={{ background: "var(--border-subtle)" }} />
            <button
              onClick={handleCopyText}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors cursor-pointer"
              style={{ color: "var(--text-primary)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-overlay)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {copying ? "Copied" : "Copy Text"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Prompt Modal */}
      <AnimatePresence>
        {showPrivacyPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => !makingPublic && setShowPrivacyPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="mx-6 w-full max-w-sm rounded-2xl p-6"
              style={{ background: "var(--bg-card)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                This argument is private
              </h3>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                To share a link to this conversation, it needs to be made public. Anyone with the link will be able to view it.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrivacyPrompt(false)}
                  disabled={makingPublic}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150"
                  style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakePublicAndShare}
                  disabled={makingPublic}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200
                             hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "var(--primary)" }}
                >
                  {makingPublic ? "Sharing..." : "Make Public & Share"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
