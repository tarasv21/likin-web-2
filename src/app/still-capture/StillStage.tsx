"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

const HeroObject = dynamic(() => import("@/components/brand/HeroObject"), { ssr: false });

export function StillStage() {
  const progress = useRef(0.73);
  const pointer = useRef({ x: 0, y: 0 });
  return (
    <div id="still" style={{ position: "fixed", inset: 0, background: "transparent" }}>
      <HeroObject progress={progress} pointer={pointer} quality="high" still />
    </div>
  );
}
