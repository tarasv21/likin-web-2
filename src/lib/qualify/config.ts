/**
 * QUALIFY — integration config.
 *
 * Stripe and Calendly are not connected yet. These read public env vars and stay undefined
 * until they are set; the UI must handle undefined and never render a fabricated URL.
 * Nothing secret belongs here: only public checkout/booking links.
 */

const clean = (v: string | undefined) => {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  // Only accept absolute https URLs, so a misconfigured value can never become a broken link.
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
};

export const integrations = {
  /** Stripe Checkout (or Payment Link) for the standard BUILD. */
  stripeBuildCheckoutUrl: clean(process.env.NEXT_PUBLIC_STRIPE_BUILD_CHECKOUT_URL),
  calendlyBuildUrl: clean(process.env.NEXT_PUBLIC_CALENDLY_BUILD_URL),
  calendlyScaleUrl: clean(process.env.NEXT_PUBLIC_CALENDLY_SCALE_URL),
} as const;

export const hasCheckout = () => Boolean(integrations.stripeBuildCheckoutUrl);
export const bookingUrl = (service: "BUILD" | "SCALE") => (service === "BUILD" ? integrations.calendlyBuildUrl : integrations.calendlyScaleUrl);
