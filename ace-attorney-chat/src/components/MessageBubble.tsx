"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "@/src/state/types";

interface MessageBubbleProps {
  message: Message;
}

const SITE_URL = "spadeattorney.netlify.app";
const LONG_PRESS_MS = 500;

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAttorney = message.sender === "attorney";
  const intensity = message.intensity ?? 1;
  const scale = intensity >= 4 ? 1 + (intensity - 4) * 0.008 : 1;

  const bubbleRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = () => setShowMenu(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [showMenu]);

  const openMenu = useCallback(
    (clientX: number, clientY: number) => {
      // Position menu relative to viewport
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

  // Prevent context menu default on mobile (we show our own)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      openMenu(e.clientX, e.clientY);
    },
    [openMenu]
  );

  // Share: download image with watermark
  const handleDownloadImage = useCallback(async () => {
    if (!bubbleRef.current || downloading) return;
    setDownloading(true);

    try {
      // Dynamic import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      // Create a wrapper with watermark for the capture
      const wrapper = document.createElement("div");
      wrapper.style.padding = "24px";
      wrapper.style.background = "#111111";
      wrapper.style.borderRadius = "16px";
      wrapper.style.display = "inline-block";
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.style.fontFamily =
        '"Berkeley Mono", system-ui, -apple-system, sans-serif';

      // Clone the bubble content
      const clone = bubbleRef.current.cloneNode(true) as HTMLElement;
      wrapper.appendChild(clone);

      // Add watermark
      const watermark = document.createElement("div");
      watermark.style.textAlign = "center";
      watermark.style.marginTop = "16px";
      watermark.style.paddingTop = "12px";
      watermark.style.borderTop = "1px solid rgba(255,255,255,0.08)";
      watermark.style.fontSize = "11px";
      watermark.style.color = "#717171";
      watermark.style.letterSpacing = "0.1em";
      watermark.textContent = SITE_URL;
      wrapper.appendChild(watermark);

      document.body.appendChild(wrapper);

      const canvas = await html2canvas(wrapper, {
        backgroundColor: "#111111",
        scale: 2,
        useCORS: true,
      });

      document.body.removeChild(wrapper);

      // Trigger download
      const link = document.createElement("a");
      link.download = `ace-attorney-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Silent fail
    }

    setDownloading(false);
    setShowMenu(false);
  }, [downloading]);

  // Copy text
  const handleCopyText = useCallback(async () => {
    setCopying(true);
    await navigator.clipboard.writeText(message.text);
    setTimeout(() => {
      setCopying(false);
      setShowMenu(false);
    }, 600);
  }, [message.text]);

  // Share link (copies a URL with the message text as a query param — or uses Web Share API)
  const handleShareLink = useCallback(async () => {
    const shareUrl = `https://${SITE_URL}`;
    const shareText = `"${message.text.slice(0, 200)}${message.text.length > 200 ? "..." : ""}" — ${SITE_URL}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: shareUrl });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
    setShowMenu(false);
  }, [message.text]);

  return (
    <>
      <motion.div
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
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={handleContextMenu}
        style={{ touchAction: "auto", userSelect: "none" }}
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
              left: Math.min(menuPos.x, window.innerWidth - 200),
              top: Math.min(menuPos.y - 10, window.innerHeight - 200),
              background: "var(--bg-card)",
              border: "1px solid rgba(255,255,255,0.1)",
              minWidth: 180,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDownloadImage}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-white/5 cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/>
              </svg>
              {downloading ? "Saving..." : "Save as Image"}
            </button>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <button
              onClick={handleShareLink}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-white/5 cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeLinecap="round"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeLinecap="round"/>
              </svg>
              Share
            </button>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <button
              onClick={handleCopyText}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-white/5 cursor-pointer"
              style={{ color: "var(--text-primary)" }}
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
    </>
  );
}
