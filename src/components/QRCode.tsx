"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

export function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: "#4c1d95", light: "#ffffff" },
      });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} />;
}
