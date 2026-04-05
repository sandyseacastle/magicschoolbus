"use client";

import { useState } from "react";
import { QRCode } from "./QRCode";

interface SessionShareBarProps {
  pin: string;
  studentCount: number;
}

export function SessionShareBar({ pin, studentCount }: SessionShareBarProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${pin}`
    : `/join/${pin}`;

  function copyLink() {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="sticker-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* PIN */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">PIN</span>
          <span className="text-3xl font-bold tracking-[0.25em] text-primary font-mono bg-fun-yellow/20 px-4 py-1.5 rounded-xl border-2 border-fun-yellow/40">
            {pin}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-border hidden sm:block" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-4 py-2 bg-surface-alt border-2 border-border rounded-xl text-sm font-bold hover:border-primary/50 transition-all"
          >
            {showQR ? "Hide QR" : "Show QR"}
          </button>
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-surface-alt border-2 border-border rounded-xl text-sm font-bold hover:border-primary/50 transition-all"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-border hidden sm:block" />

        {/* Student Count */}
        <div className="badge-fun bg-fun-green/10 text-fun-green">
          <div className="w-3 h-3 bg-fun-green rounded-full animate-pulse" />
          <span className="font-bold">
            {studentCount} explorer{studentCount !== 1 ? "s" : ""} connected
          </span>
        </div>
      </div>

      {/* QR Code */}
      {showQR && (
        <div className="mt-4 flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-[3px] border-border">
          <QRCode value={joinUrl} size={250} />
          <p className="text-xs text-muted font-bold">Scan to join the adventure!</p>
        </div>
      )}
    </div>
  );
}
