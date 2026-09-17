"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { FINGERPRINT_RIDGES, FINGERPRINT_VIEWBOX } from "@/data/fingerprint";

/**
 * HERO 3D — the real Likin fingerprint extruded from the traced logo geometry.
 * Material: brushed teal titanium (metal, anisotropic, clear-coated) under a three-light rig
 * whose incidence changes with scroll, so tones drift teal → white → blue → warm as you scroll.
 * Rotation stays within ~35°; the object dollies in, lifts and hands over to the next section.
 * Desktop with fine pointer only. Loaded lazily; the PNG render underneath is the LCP fallback.
 */
export type SceneHandle = { progress: React.MutableRefObject<number>; pointer: React.MutableRefObject<{ x: number; y: number }>; onReady?: () => void; variant?: "hero" | "cta" };

export default function HeroScene({ progress, pointer, onReady, variant = "hero" }: SceneHandle) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    let disposed = false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", stencil: false });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = variant === "cta" ? 0.9 : 1.0;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
    camera.position.set(0, 0, 6.4);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.9;

    // --- geometry: real ridges → shapes → rounded extrusions
    const [vx, vy, vw, vh] = FINGERPRINT_VIEWBOX.split(" ").map(Number);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FINGERPRINT_VIEWBOX}">${FINGERPRINT_RIDGES.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
    const parsed = new SVGLoader().parse(svg);
    // Brushed teal titanium: metal, rough enough to read as anodised (not jewellery),
    // strongly anisotropic so highlights stretch along the ridges like brushed metal.
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(variant === "cta" ? 0x0a4f43 : 0x0c6b59),
      metalness: 1,
      roughness: 0.46,
      clearcoat: 0.3,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.85,
      anisotropy: 0.85,
      anisotropyRotation: Math.PI / 2,
    });
    // Potrace outlines contain near-duplicate points that break the triangulator: resample and clean.
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
    const extrude: THREE.ExtrudeGeometryOptions = { depth: 58, bevelEnabled: true, bevelThickness: 20, bevelSize: 17, bevelOffset: -2, bevelSegments: 5, curveSegments: 6 };
    for (const p of parsed.paths) {
      for (const raw of SVGLoader.createShapes(p)) {
        const shape = new THREE.Shape(clean(raw.getPoints(5)));
        for (const h of raw.holes) shape.holes.push(new THREE.Path(clean(h.getPoints(5))));
        const geo = new THREE.ExtrudeGeometry(shape, extrude);
        geo.computeVertexNormals();
        group.add(new THREE.Mesh(geo, material));
      }
    }
    // SVG space: y grows downwards → flip; centre on the viewBox; normalise height to 2.7 units
    const s = 2.7 / vh;
    group.scale.set(s, -s, s);
    group.position.set(-(vx + vw / 2) * s, (vy + vh / 2) * s, -32 * s);
    const pivot = new THREE.Group();
    pivot.add(group);
    scene.add(pivot);

    // --- lights: key (warm), rim (cool), fill (mint)
    const key = new THREE.DirectionalLight(0xfff0d8, 2.0);
    const rim = new THREE.DirectionalLight(0x8ac6ff, 1.4);
    const fill = new THREE.DirectionalLight(0x78f5d8, 0.7);
    key.position.set(3.2, 3.6, 4.5);
    rim.position.set(-4, 1.5, -2.5);
    fill.position.set(-2.5, -3, 4);
    scene.add(key, rim, fill, new THREE.AmbientLight(0xffffff, 0.12));

    // --- sizing
    const resize = () => {
      const w = parent.clientWidth, h = parent.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    // --- animation state
    let inView = true;
    let raf = 0;
    const start = performance.now();
    const cur = { ry: 0, rx: 0, px: 0, py: 0 };
    const warm = new THREE.Color(0xfff0d8), gold = new THREE.Color(0xffd08a);
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) loop();
    }, { threshold: 0 });
    io.observe(parent);

    let readyFired = false;
    const loop = () => {
      if (disposed || !inView) return;
      raf = requestAnimationFrame(loop);
      const t = (performance.now() - start) / 1000;
      const p = progress.current;
      const intro = Math.min(1, t / 1.6);
      const easeIntro = 1 - Math.pow(1 - intro, 3);

      // targets
      // CTA: the mark is pressed onto the page — it comes down tilted and a touch closer to
      // the camera, then flattens and settles on contact. No spin; we leave a print.
      const pr = variant === "cta" ? Math.min(1, Math.max(0, (p - 0.1) / 0.42)) : 0;
      const press = variant === "cta" ? pr * pr * (3 - 2 * pr) : 0;
      const targetRy = (variant === "cta" ? 0.2 - press * 0.2 : -0.26 + p * 0.6) + pointer.current.x * 0.07 + (1 - easeIntro) * -0.55;
      const targetRx = (variant === "cta" ? 0.22 - press * 0.22 : 0.1 - p * 0.22) + pointer.current.y * 0.05;
      // slow spring towards targets + a barely-there idle drift
      cur.ry += (targetRy - cur.ry) * 0.06;
      cur.rx += (targetRx - cur.rx) * 0.06;
      const idle = Math.sin(t * 0.55) * 0.012;
      pivot.rotation.y = cur.ry + idle;
      pivot.rotation.x = cur.rx + Math.cos(t * 0.4) * 0.006;
      if (variant === "cta") {
        pivot.position.y = (1 - press) * 0.55;
        pivot.position.x = (1 - press) * -0.3;
        const s = 1.12 - press * 0.12;
        pivot.scale.setScalar(s);
        camera.position.z = 6.4;
      } else {
        pivot.position.y = p * 1.7 + (1 - easeIntro) * -0.25;
        pivot.position.x = p * 0.35;
        camera.position.z = 6.4 - p * 1.1;
      }

      // light rig sweeps with scroll: incidence changes → tone changes
      key.position.set(3.2 - p * 7.5, 3.6 - p * 1.5, 4.5 + p * 1.5);
      key.intensity = 2.0 + p * 1.2;
      key.color.copy(warm).lerp(gold, Math.min(1, p * 1.4));
      rim.position.set(-4 + p * 8, 1.5 + p * 2.5, -2.5);
      rim.intensity = 1.4 + p * 1.6;
      fill.intensity = 0.7 + Math.sin(t * 0.3) * 0.1;
      scene.environmentIntensity = 0.9 + p * 0.5;
      material.roughness = 0.46 - p * 0.12;

      renderer.render(scene, camera);
      if (!readyFired) {
        readyFired = true;
        onReady?.();
      }
    };
    loop();
    if (process.env.NODE_ENV !== "production") {
      const box = new THREE.Box3().setFromObject(pivot);
      (window as unknown as { __likinHero?: unknown }).__likinHero = { meshes: group.children.length, paths: parsed.paths.length, box: { min: box.min.toArray(), max: box.max.toArray() }, size: [parent.clientWidth, parent.clientHeight] };
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
      });
      material.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [progress, pointer, onReady, variant]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" role="img" aria-label="Huella de Likin en titanio, gira suavemente al hacer scroll" />;
}
