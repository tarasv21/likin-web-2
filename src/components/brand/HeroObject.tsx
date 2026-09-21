"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { FINGERPRINT_RIDGES, FINGERPRINT_VIEWBOX } from "@/data/fingerprint";

/**
 * THE LIKIN OBJECT — the real fingerprint geometry as a heavy piece of dark titanium under
 * studio light. The scroll is the camera: macro → medium → full object. The teal is not the
 * material; it is one light that travels across the metal and is caught, ridge by ridge.
 *
 * Quality tiers: "high" (desktop) — physical material, anisotropy, clearcoat, DPR ≤ 1.5.
 * "lite" (mobile) — standard material, fewer segments, DPR ≤ 1.25, render on demand.
 */
export type HeroObjectProps = {
  /** 0 → 1 across the hero scroll track */
  progress: React.MutableRefObject<number>;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  quality: "high" | "lite";
  /** Called once the first frame is on screen */
  onReady?: () => void;
  /** Receives the screen-space anchor (px, relative to the canvas) of the bottom of the print, every frame */
  onAnchor?: (x: number, y: number, visible: boolean) => void;
  /** Freeze at the hero moment (reduced motion / capture) */
  still?: boolean;
};

export const OBJECT_HEIGHT = 2.7;
const FOV = 26;

/** Smoothstep between two progress marks */
const seg = (p: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * A dark studio, not a showroom: black everywhere, one wide soft key strip above-front and a
 * narrow cool strip to the side. Brushed metal reads the strips as travelling reflections.
 */
function makeStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const strip = (w: number, h: number, color: number, intensity: number, pos: [number, number, number], look: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(...look);
    scene.add(m);
  };
  strip(18, 5, 0xf4f3ee, 6.0, [0, 7, 6], [0, 0, 0]); // key softbox, above-front (a hair warm: silver, not cyan)
  strip(9, 9, 0xe6ebe9, 1.5, [-7, 2.5, 9], [0, 0, 0]); // second softbox, front-left: broad silver bands on the tops
  strip(14, 10, 0xa3b0ac, 0.9, [0, 0, 11], [0, 0, 0]); // wide dim fill, front: base sheen on every face
  strip(1.4, 9, 0xd9e6e2, 2.0, [-8, 0, 2], [0, 0, 0]); // cool edge strip, left
  strip(1.2, 9, 0x78f5d8, 1.4, [8, -1, 1], [0, 0, 0]); // teal strip, right (cold rim)
  strip(12, 12, 0x2a302e, 0.6, [0, -8, 2], [0, 0, 0]); // floor bounce
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  return tex;
}

export default function HeroObject({ progress, pointer, quality, onReady, onAnchor, still = false }: HeroObjectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    let disposed = false;
    const lite = quality === "lite";

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: lite ? "default" : "high-performance", stencil: false, depth: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = lite ? 1.32 : 1.1;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
    const envTex = makeStudioEnvironment(renderer);
    scene.environment = envTex;
    scene.environmentIntensity = lite ? 1.1 : 0.95;

    // --- geometry: the real ridges → shapes → bevelled extrusions
    const [vx, vy, vw, vh] = FINGERPRINT_VIEWBOX.split(" ").map(Number);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FINGERPRINT_VIEWBOX}">${FINGERPRINT_RIDGES.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
    const parsed = new SVGLoader().parse(svg);

    // Dark titanium / gunmetal. Nearly black base; the colour of the piece comes from what it reflects.
    const material = lite
      ? new THREE.MeshStandardMaterial({ color: 0x1c2422, metalness: 1, roughness: 0.36, envMapIntensity: 1 })
      : new THREE.MeshPhysicalMaterial({ color: 0x1b2321, metalness: 1, roughness: 0.32, clearcoat: 0.25, clearcoatRoughness: 0.35, envMapIntensity: 1, anisotropy: 0.5, anisotropyRotation: Math.PI / 2 });

    const clean = (pts: THREE.Vector2[]) => {
      const out: THREE.Vector2[] = [];
      for (const pt of pts) {
        const last = out[out.length - 1];
        if (!last || last.distanceTo(pt) > 2) out.push(pt);
      }
      if (out.length > 2 && out[0].distanceTo(out[out.length - 1]) < 2) out.pop();
      return out;
    };
    const group = new THREE.Group();
    const extrude: THREE.ExtrudeGeometryOptions = lite
      ? { depth: 58, bevelEnabled: true, bevelThickness: 18, bevelSize: 15, bevelOffset: -2, bevelSegments: 2, curveSegments: 3 }
      : { depth: 58, bevelEnabled: true, bevelThickness: 20, bevelSize: 17, bevelOffset: -2, bevelSegments: 5, curveSegments: 6 };
    const div = lite ? 10 : 5;
    // Build one ridge per frame: eleven short tasks instead of one long one (keeps the main
    // thread free on mobile; the piece fades in once complete).
    const rawShapes = parsed.paths.flatMap((p) => SVGLoader.createShapes(p));
    let built = 0;
    let buildRaf = 0;
    const buildNext = () => {
      if (disposed) return;
      const raw = rawShapes[built];
      if (raw) {
        const shape = new THREE.Shape(clean(raw.getPoints(div)));
        for (const h of raw.holes) shape.holes.push(new THREE.Path(clean(h.getPoints(div))));
        const geo = new THREE.ExtrudeGeometry(shape, extrude);
        geo.computeVertexNormals();
        group.add(new THREE.Mesh(geo, material));
        built++;
      }
      if (built < rawShapes.length) buildRaf = requestAnimationFrame(buildNext);
      else {
        complete = true;
        dirty = true;
        loop();
      }
    };
    let complete = false;
    const s = OBJECT_HEIGHT / vh;
    group.scale.set(s, -s, s);
    group.position.set(-(vx + vw / 2) * s, (vy + vh / 2) * s, -29 * s);
    const pivot = new THREE.Group();
    pivot.add(group);
    scene.add(pivot);
    const objW = (vw / vh) * OBJECT_HEIGHT;

    // --- lights. The teal is a light, not a paint.
    const key = new THREE.DirectionalLight(0xf3f1ea, 1.0); // soft white form light, a hair warm
    key.position.set(2.5, 4, 3.5);
    const rim = new THREE.DirectionalLight(0xbfe9dd, 1.1); // cold edge from behind-left
    rim.position.set(-4, 2.5, -3);
    const sweep = new THREE.PointLight(0x2ee6c3, 0, 9, 1.6); // the travelling Likin light
    const sweep2 = new THREE.PointLight(0x78f5d8, 0, 6, 2); // its softer echo
    scene.add(key, rim, sweep, sweep2, new THREE.AmbientLight(0xffffff, 0.04));

    // --- sizing
    let aspect = 1;
    const resize = () => {
      const w = parent.clientWidth, h = parent.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    // --- camera framing helpers
    const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    /** distance so the object spans `k` of the viewport height */
    const distForHeightFraction = (k: number) => OBJECT_HEIGHT / (k * 2 * tanH);
    /** distance so the object spans `k` of the viewport width */
    const distForWidthFraction = (k: number) => objW / (k * 2 * tanH * aspect);

    // --- state
    let inView = true, raf = 0, dirty = true, lastP = -1, readyFired = false;
    const start = performance.now();
    const cur = { ry: 0, rx: 0, cx: 0, cy: 0, cz: 6, tx: 0, ty: 0 };
    const target = new THREE.Vector3();
    const anchor = new THREE.Vector3();
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) {
        dirty = true;
        loop();
      }
    }, { threshold: 0 });
    io.observe(parent);

    const frame = (p: number, t: number) => {
      const portrait = aspect < 1;
      const intro = still ? 1 : Math.min(1, t / 2.2);
      const easeIntro = 1 - Math.pow(1 - intro, 3);

      // ── Camera choreography ───────────────────────────────────────────
      // 0–0.2 macro · 0.2–0.65 pull back · 0.65–0.8 hero moment · 0.8–1 hand-over
      const pull = seg(p, 0.14, 0.68);
      const settle = seg(p, 0.66, 0.8);
      // Macro: the object spans ~2.3× the viewport height → ~40% visible, off-frame.
      // Hero: full object, 0.78 of the height on desktop; 0.8 of the width on portrait.
      const dMacro = distForHeightFraction(portrait ? 2.05 : 2.3);
      const dHero = portrait ? distForWidthFraction(0.8) : distForHeightFraction(0.74);
      const dist = THREE.MathUtils.lerp(dMacro, dHero, pull);
      // Where the camera looks: macro shows the upper part of the print sitting to the right
      // (desktop) or off the right edge (portrait); it pans to the centre while pulling back.
      const halfW = dMacro * tanH * aspect;
      const macroX = portrait ? -halfW * 0.58 : -halfW * 0.62;
      const macroY = portrait ? 0.62 : 0.5;
      const tx = THREE.MathUtils.lerp(macroX, 0, pull);
      const ty = THREE.MathUtils.lerp(macroY, portrait ? -0.08 : -0.16, pull);
      // Rotation: a heavy piece turning a few degrees, no more.
      const maxRy = portrait ? 0.07 : 0.16;
      const ry = THREE.MathUtils.lerp(-maxRy, portrait ? 0.02 : 0.05, pull) + (still ? 0 : pointer.current.x * (portrait ? 0 : 0.035)) + (1 - easeIntro) * (portrait ? -0.12 : -0.22);
      const rx = THREE.MathUtils.lerp(portrait ? 0.05 : 0.09, 0, pull) + (still ? 0 : pointer.current.y * (portrait ? 0 : 0.025));

      const k = still ? 1 : lite ? 0.12 : 0.085; // heavy object: slow follow
      cur.cz += (dist - cur.cz) * k;
      cur.tx += (tx - cur.tx) * k;
      cur.ty += (ty - cur.ty) * k;
      cur.ry += (ry - cur.ry) * k;
      cur.rx += (rx - cur.rx) * k;
      const idle = still || lite ? 0 : Math.sin(t * 0.5) * 0.006;
      pivot.rotation.set(cur.rx + (still ? 0 : Math.cos(t * 0.37) * 0.003), cur.ry + idle, 0);
      camera.position.set(cur.tx, cur.ty + (1 - easeIntro) * -0.35, cur.cz);
      target.set(cur.tx, cur.ty, 0);
      camera.lookAt(target);

      // ── Light choreography ────────────────────────────────────────────
      // The Likin light travels down and across the surface with the scroll. At the hero
      // moment it settles above-right and the piece is at its most legible.
      const sw = seg(p, 0.06, 0.78);
      const lx = THREE.MathUtils.lerp(2.6, -1.6, sw), ly = THREE.MathUtils.lerp(2.4, 1.2, sw);
      sweep.position.set(lx, ly, 2.2);
      sweep.intensity = (lite ? 26 : 24) * (0.25 + 0.75 * easeIntro);
      sweep2.position.set(1.4, -1.6 + 0.6 * settle, 2.4);
      sweep2.intensity = (lite ? 6 : 7) * easeIntro * (0.35 + 0.65 * settle);
      key.intensity = (lite ? 1.2 : 1.1) + 1.1 * settle;
      rim.intensity = 1.3 + 0.4 * (1 - settle);
      scene.environmentIntensity = (lite ? 1.15 : 1.0) * (0.55 + 0.45 * easeIntro) + 0.5 * settle;

      // ── Anchor: bottom of the print in screen space (for the line hand-over) ──
      if (onAnchor) {
        anchor.set(0, -OBJECT_HEIGHT / 2 + 0.02, 0.06).applyMatrix4(pivot.matrixWorld).project(camera);
        const w = parent.clientWidth, h = parent.clientHeight;
        onAnchor(((anchor.x + 1) / 2) * w, ((1 - anchor.y) / 2) * h, anchor.z < 1);
      }
      renderer.render(scene, camera);
    };

    let lastT = 0;
    const loop = () => {
      if (disposed || !inView || !complete) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const t = (now - start) / 1000;
      const p = progress.current;
      const moving = p !== lastP || dirty || t < 3.2 || (!lite && !still) || (still && t < 0.4);
      if (!moving) {
        // lite: settle the follow-through, then idle at zero cost
        if (now - lastT < 700) frame(p, t);
        return;
      }
      if (p !== lastP || dirty) lastT = now;
      lastP = p;
      dirty = false;
      frame(p, t);
      if (!readyFired) {
        readyFired = true;
        onReady?.();
      }
    };
    pivot.updateMatrixWorld(true);
    resize();
    // Start settled at the right place instead of springing in from zero.
    frame(still ? 0.73 : progress.current, still ? 10 : 0);
    Object.assign(cur, { cz: camera.position.z, tx: target.x, ty: target.y, ry: pivot.rotation.y, rx: pivot.rotation.x });
    buildRaf = requestAnimationFrame(buildNext);
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __likinHero?: unknown }).__likinHero = { quality, meshes: group.children.length, triangles: renderer.info.render.triangles, dpr: renderer.getPixelRatio(), size: [parent.clientWidth, parent.clientHeight] };
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(buildRaf);
      ro.disconnect();
      io.disconnect();
      group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
      });
      material.dispose();
      envTex.dispose();
      renderer.dispose();
    };
  }, [progress, pointer, quality, onReady, onAnchor, still]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" role="img" aria-label="La huella de Likin como una pieza de titanio oscuro bajo una luz de estudio; el scroll aleja la cámara hasta mostrarla completa" />;
}
