"use client";

import React, { useEffect, useRef, useState } from "react";

type OTPInputProps = {
  length?: number;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  className?: string;
};

export default function OTPInput({
  length = 6,
  onComplete,
  disabled = false,
  className = "",
}: OTPInputProps) {
  const [values, setValues] = useState<string[]>(() =>
    Array.from({ length }).map(() => ""),
  );
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const firstEmpty = values.findIndex((v) => v === "");
    const idx = firstEmpty === -1 ? length - 1 : firstEmpty;
    inputsRef.current[idx]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const joined = values.join("");
    if (joined.length === length && !values.includes("") && onComplete) {
      onComplete(joined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.join("")]);

  const updateAt = (i: number, v: string) => {
    setValues((s) => {
      const copy = [...s];
      copy[i] = v;
      return copy;
    });
  };

  const handleChange = (val: string, i: number) => {
    if (disabled) return;
    const char = val.slice(-1).replace(/\s+/g, "");
    if (!char && val === "") {
      updateAt(i, "");
      return;
    }
    if (!/^[0-9A-Za-z]$/.test(char)) return;
    updateAt(i, char);
    const next = i + 1;
    if (next < length) {
      inputsRef.current[next]?.focus();
      inputsRef.current[next]?.select();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number,
  ) => {
    if (disabled) return;
    const key = e.key;
    if (key === "Backspace") {
      if (values[i]) {
        updateAt(i, "");
      } else {
        const prev = i - 1;
        if (prev >= 0) {
          inputsRef.current[prev]?.focus();
          updateAt(prev, "");
        }
      }
    } else if (key === "ArrowLeft") {
      const prev = i - 1;
      if (prev >= 0) inputsRef.current[prev]?.focus();
    } else if (key === "ArrowRight") {
      const next = i + 1;
      if (next < length) inputsRef.current[next]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    const chars = pasted.replace(/\s+/g, "").split("").slice(0, length);
    if (chars.length === 0) return;
    setValues(() => {
      const out = Array.from({ length }).map((_, idx) => chars[idx] ?? "");
      return out;
    });
    const focusIdx = Math.min(chars.length - 1, length - 1);
    inputsRef.current[focusIdx]?.focus();
    inputsRef.current[focusIdx]?.select();
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={values[i]}
          onChange={(e) => handleChange(e.target.value, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`OTP digit ${i + 1}`}
          className="w-12 h-12 text-center rounded-md border border-slate-200 shadow-sm text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      ))}
    </div>
  );
}
