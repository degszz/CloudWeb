'use client';

import { useEffect, useRef } from 'react';

/**
 * Scroll-zoom 3D divider — fly through 30 nested wireframe rectangle planes.
 * Camera Z is driven by scroll progress over the section (200vh tall, sticky canvas).
 * Theme-aware: dark lines on light bg, light lines on dark bg.
 */
export function CloudScroll() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const mount = mountRef.current;
    if (!section || !mount) return;

    let THREE: typeof import('three');
    let renderer: import('three').WebGLRenderer;
    let raf: number;
    let disposed = false;

    async function init() {
      THREE = await import('three');
      if (disposed) return;

      const W = () => mount!.clientWidth;
      const H = () => mount!.clientHeight;

      const scene = new THREE.Scene();
      // No background — transparent, inherits page bg
      const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 1000);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.setSize(W(), H());
      renderer.setClearColor(0x000000, 0);
      mount!.appendChild(renderer.domElement);

      // --- Detect theme for line color ---
      function getLineColor() {
        return document.documentElement.getAttribute('data-theme') === 'light'
          ? 0x000000
          : 0xffffff;
      }

      // --- 30 nested wireframe rectangles along Z ---
      const COUNT = 30;
      type LayerGroup = import('three').Group & { __materials: import('three').LineBasicMaterial[] };
      const layers: LayerGroup[] = [];

      for (let i = 0; i < COUNT; i++) {
        const grp = new THREE.Group() as LayerGroup;
        grp.__materials = [];

        const w = 4 + i * 0.6;
        const h = 2.4 + i * 0.36;

        // Outer wireframe rectangle
        const eg = new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h));
        const lm = new THREE.LineBasicMaterial({
          color: getLineColor(),
          transparent: true,
          opacity: 0.7,
        });
        grp.add(new THREE.LineSegments(eg, lm));
        grp.__materials.push(lm);

        // Inner layout blocks (simulated "webpage" wireframe)
        const innerEg1 = new THREE.EdgesGeometry(
          new THREE.PlaneGeometry(w * 0.6, h * 0.55)
        );
        const m1mat = new THREE.LineBasicMaterial({
          color: getLineColor(),
          transparent: true,
          opacity: 0.6,
        });
        const m1 = new THREE.LineSegments(innerEg1, m1mat);
        m1.position.set(-w * 0.18, h * 0.18, 0.001);
        grp.add(m1);
        grp.__materials.push(m1mat);

        const innerEg2 = new THREE.EdgesGeometry(
          new THREE.PlaneGeometry(w * 0.3, h * 0.4)
        );
        const m2mat = new THREE.LineBasicMaterial({
          color: getLineColor(),
          transparent: true,
          opacity: 0.6,
        });
        const m2 = new THREE.LineSegments(innerEg2, m2mat);
        m2.position.set(w * 0.28, -h * 0.2, 0.001);
        grp.add(m2);
        grp.__materials.push(m2mat);

        grp.position.z = -i * 4;
        scene.add(grp);
        layers.push(grp);
      }

      // --- Theme observer: update line colors ---
      function updateColors() {
        const color = new THREE.Color(getLineColor());
        for (const grp of layers) {
          for (const m of grp.__materials) {
            m.color.copy(color);
          }
        }
      }

      const themeObs = new MutationObserver(updateColors);
      themeObs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });

      // --- Resize ---
      function onResize() {
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
        renderer.setSize(W(), H());
      }
      window.addEventListener('resize', onResize);

      // --- Scroll progress ---
      function getProgress() {
        const r = section!.getBoundingClientRect();
        const total = section!.offsetHeight - window.innerHeight;
        if (total <= 0) return 0;
        const scrolled = -r.top;
        return Math.max(0, Math.min(1, scrolled / total));
      }

      // --- Animation ---
      function animate() {
        if (disposed) return;
        raf = requestAnimationFrame(animate);

        const p = getProgress();

        // Camera flies from z=6 → z=-110
        camera.position.z = 6 - p * 116;
        camera.position.x = Math.sin(p * Math.PI * 2) * 0.4;
        camera.position.y = Math.cos(p * Math.PI * 2) * 0.2;
        camera.lookAt(0, 0, -50);

        // Fade layers behind camera
        for (const grp of layers) {
          const dz = grp.position.z - camera.position.z;
          const op = dz < -2 ? 0 : Math.min(1, (dz + 2) / 8);
          for (const m of (grp as LayerGroup).__materials) {
            m.opacity = op * 0.75;
          }
        }

        renderer.render(scene, camera);
      }
      animate();

      return () => {
        themeObs.disconnect();
        window.removeEventListener('resize', onResize);
      };
    }

    const cleanup = init();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup.then(fn => fn?.());
      renderer?.dispose();
      if (mount && renderer?.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '200vh',
        overflow: 'hidden',
      }}
    >
      {/* Sticky canvas container */}
      <div
        ref={mountRef}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
        }}
      />

      {/* Text overlays that fade in/out at scroll milestones */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200vh',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <ScrollText
          text="Imaginá."
          startVh={10}
          endVh={35}
          italic
          size="clamp(2rem, 6vw, 5rem)"
        />
        <ScrollText
          text="Hablá."
          startVh={40}
          endVh={65}
          size="clamp(2.5rem, 8vw, 7rem)"
        />
        <ScrollText
          text="Publicá."
          startVh={70}
          endVh={95}
          italic
          size="clamp(3rem, 10vw, 9rem)"
          bold
        />
      </div>
    </section>
  );
}

/**
 * Scroll-triggered text overlay that appears at a certain scroll position
 * within the 200vh section.
 */
function ScrollText({
  text,
  startVh,
  endVh,
  italic,
  size,
  bold,
}: {
  text: string;
  startVh: number;
  endVh: number;
  italic?: boolean;
  size: string;
  bold?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const section = el.closest('section');
    if (!section) return;

    function onScroll() {
      const rect = section!.getBoundingClientRect();
      const total = section!.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / total)) * 100;

      const mid = (startVh + endVh) / 2;
      const fadeIn = startVh;
      const fadeOut = endVh;

      let opacity = 0;
      if (progress >= fadeIn && progress <= fadeOut) {
        if (progress < mid) {
          opacity = (progress - fadeIn) / (mid - fadeIn);
        } else {
          opacity = 1 - (progress - mid) / (fadeOut - mid);
        }
      }

      const yShift = progress < mid ? (1 - opacity) * 20 : 0;

      el!.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      el!.style.transform = `translate(-50%, -50%) translateY(${yShift}px)`;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [startVh, endVh]);

  return (
    <span
      ref={ref}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--font-fraunces, var(--font-display))',
        fontWeight: bold ? 400 : 300,
        fontStyle: italic ? 'italic' : 'normal',
        fontSize: size,
        letterSpacing: '-0.05em',
        color: 'var(--ink-strong)',
        opacity: 0,
        transition: 'transform 0.3s ease-out',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}
    >
      {text}
    </span>
  );
}
