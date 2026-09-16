export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Maps v from [a,b] to [0,1], clamped. */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);

/** "1.397 €" / "465,67 €" — always groups thousands (es-ES skips the dot on 4-digit numbers). */
export const formatEUR = (n: number) => {
  const fixed = n % 1 === 0 ? String(Math.round(n)) : n.toFixed(2);
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped}${dec ? "," + dec : ""} €`;
};

export const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export const pad2 = (n: number) => String(n).padStart(2, "0");
