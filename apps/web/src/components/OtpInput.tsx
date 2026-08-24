import { useCallback, useRef } from "react";
import { twMerge } from "tailwind-merge";

const OTP_LEN = 6;

export function OtpInput({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const digits = Array.from({ length: OTP_LEN }, (_, index) => value[index] ?? "");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusIndex = useCallback((index: number) => {
    const el = refs.current[Math.max(0, Math.min(OTP_LEN - 1, index))];
    el?.focus();
    el?.select();
  }, []);

  function apply(raw: string) {
    const cleaned = raw.replace(/\D/g, "").slice(0, OTP_LEN);
    onChange(cleaned);
    focusIndex(Math.min(cleaned.length, OTP_LEN - 1));
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={(event) => {
      const text = event.clipboardData.getData("text");
      if (/\d/.test(text)) {
        event.preventDefault();
        apply(text);
      }
    }}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className={twMerge(
            "h-12 w-10 rounded-xl border border-line bg-white text-center text-lg font-semibold tracking-widest outline-none transition sm:h-14 sm:w-12",
            "focus:border-black focus:ring-2 focus:ring-black/10",
            error && "border-red-500",
          )}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "");
            if (next.length > 1) {
              apply(next);
              return;
            }
            const chars = digits.slice();
            chars[index] = next.slice(-1);
            onChange(chars.join(""));
            if (next && index < OTP_LEN - 1) focusIndex(index + 1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) focusIndex(index - 1);
            if (event.key === "ArrowLeft" && index > 0) focusIndex(index - 1);
            if (event.key === "ArrowRight" && index < OTP_LEN - 1) focusIndex(index + 1);
          }}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
