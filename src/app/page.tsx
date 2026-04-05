"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  function handleDigit(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");

    if (value && index < 5) {
      const next = document.getElementById(`pin-${index + 1}`);
      next?.focus();
    }

    if (value && index === 5 && newPin.every((d) => d)) {
      joinSession(newPin.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prev = document.getElementById(`pin-${index - 1}`);
      prev?.focus();
      const newPin = [...pin];
      newPin[index - 1] = "";
      setPin(newPin);
    }
    if (e.key === "Enter") {
      const code = pin.join("");
      if (code.length === 6) joinSession(code);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newPin = pasted.split("");
      setPin(newPin);
      joinSession(pasted);
    }
  }

  async function joinSession(code: string) {
    setChecking(true);
    setError("");
    const res = await fetch(`/api/sessions/${code}`);
    if (res.ok) {
      router.push(`/join/${code}`);
    } else {
      setError("Hmm, that PIN didn't work. Double-check and try again!");
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col hero-gradient relative overflow-hidden">
      {/* Twinkling stars */}
      {[...Array(15)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="twinkle-star"
          style={{
            top: `${6 + (i * 7) % 65}%`,
            left: `${3 + (i * 13) % 92}%`,
            animationDelay: `${i * 0.35}s`,
            width: `${4 + (i % 3) * 2}px`,
            height: `${4 + (i % 3) * 2}px`,
          }}
        />
      ))}

      {/* Drifting clouds */}
      <div className="drift-cloud w-72 h-20 top-[10%] left-[2%]" style={{ animationDelay: "0s" }} />
      <div className="drift-cloud w-56 h-16 top-[30%] right-[3%]" style={{ animationDelay: "4s" }} />
      <div className="drift-cloud w-64 h-[4.5rem] bottom-[18%] left-[12%]" style={{ animationDelay: "8s" }} />

      {/* Floating decorations */}
      <div className="float-shape top-[12%] left-[6%] text-6xl select-none" style={{ animationDelay: "0s" }}>
        <span className="opacity-30">&#129680;</span>
      </div>
      <div className="float-shape top-[55%] right-[8%] text-5xl select-none" style={{ animationDelay: "2s" }}>
        <span className="opacity-30">&#128640;</span>
      </div>
      <div className="float-shape bottom-[22%] left-[68%] text-4xl select-none" style={{ animationDelay: "4s" }}>
        <span className="opacity-25">&#11088;</span>
      </div>
      <div className="float-shape top-[32%] left-[82%] text-5xl select-none" style={{ animationDelay: "1s" }}>
        <span className="opacity-25">&#127757;</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md text-center">
          {/* Logo & Title */}
          <div className="mb-10">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-5 bg-fun-yellow border-[3px] border-[#1e293b]"
              style={{ boxShadow: "4px 4px 0 #1e293b" }}
            >
              <span className="text-6xl" role="img" aria-label="school bus">&#128652;</span>
            </div>
            <h1
              className="text-5xl font-bold text-white mb-3 tracking-tight"
              style={{ textShadow: "3px 3px 0 rgba(30,41,59,0.4)" }}
            >
              VR Excursions
            </h1>
            <p className="text-blue-100 text-xl font-medium">
              Ready for an adventure? Enter your PIN!
            </p>
          </div>

          {/* PIN Card */}
          <div className="sticker-card p-8">
            <p className="text-muted text-sm font-bold mb-4 uppercase tracking-wider">Your Secret Code</p>
            <div className="flex justify-center gap-1.5 sm:gap-2.5 mb-6" onPaste={handlePaste}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  id={`pin-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="pin-input w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-surface-alt border-2 border-border rounded-xl text-foreground placeholder-muted/30 focus:outline-none focus:border-fun-yellow transition-all"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && (
              <div className="bg-danger/10 border-2 border-danger/30 rounded-xl px-4 py-2.5 mb-4">
                <p className="text-danger text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={() => joinSession(pin.join(""))}
              disabled={pin.some((d) => !d) || checking}
              className="btn-3d w-full py-4 bg-accent text-white text-lg"
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Blasting off...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Launch Adventure
                  <span className="text-xl">&#128640;</span>
                </span>
              )}
            </button>
          </div>

          <div className="mt-8">
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 text-sm text-blue-100/80 hover:text-white transition-colors group font-bold"
            >
              <span>&#127891;</span>
              Teachers — Create an excursion
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
