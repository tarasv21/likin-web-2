import { notFound } from "next/navigation";
import { StillStage } from "./StillStage";

/** Dev-only: renders the hero object at the hero moment on a transparent canvas so the
 *  static fallback (reduced motion / no WebGL) can be captured from the real scene. */
export default function StillPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StillStage />;
}
