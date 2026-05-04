'use client';

import { useEffect, useRef } from 'react';

/**
 * Hero 3D — soft round "pelotitas" forming a volumetric cumulus cloud.
 * ~3600 particles via rejection sampling inside union-of-spheres.
 * ShaderMaterial with canvas radial-gradient dot texture.
 * Explode on hover/drag. Theme-aware (dark dots on light bg, light on dark).
 */
export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let THREE: typeof import('three');
    let renderer: import('three').WebGLRenderer;
    let raf: number;
    let disposed = false;

    async function init() {
      THREE = await import('three');
      if (disposed) return;

      const W = container!.clientWidth;
      const H = container!.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
      camera.position.set(0, 0.2, 9.5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);
      container!.appendChild(renderer.domElement);

      // --- Cloud shape: union of spheres ---
      const lobes: { c: [number, number, number]; r: number }[] = [
        { c: [0.0, 0.6, 0.0], r: 1.6 },
        { c: [-1.4, 0.5, 0.2], r: 1.1 },
        { c: [1.4, 0.6, -0.2], r: 1.2 },
        { c: [-0.5, 1.6, 0.3], r: 1.1 },
        { c: [0.7, 1.7, -0.3], r: 1.05 },
        { c: [0.0, 2.0, 0.0], r: 0.85 },
        { c: [-2.0, 0.8, -0.4], r: 0.7 },
        { c: [2.1, 0.9, 0.4], r: 0.7 },
      ];

      function inCloud(x: number, y: number, z: number) {
        for (const l of lobes) {
          const dx = x - l.c[0], dy = y - l.c[1], dz = z - l.c[2];
          if (dx * dx + dy * dy + dz * dz < l.r * l.r) return true;
        }
        return false;
      }

      // --- Rejection-sample 3600 particles inside the cloud ---
      const COUNT = 3600;
      const positions = new Float32Array(COUNT * 3);
      const sizes = new Float32Array(COUNT);
      const seeds = new Float32Array(COUNT);

      let idx = 0, attempts = 0;
      while (idx < COUNT && attempts < 200000) {
        attempts++;
        const x = (Math.random() - 0.5) * 7;
        const y = (Math.random() - 0.5) * 5 + 1.0;
        const z = (Math.random() - 0.5) * 3;
        if (inCloud(x, y, z)) {
          positions[idx * 3] = x;
          positions[idx * 3 + 1] = y;
          positions[idx * 3 + 2] = z;

          // Bigger particles deeper in the cloud, smaller near edges
          let nearEdge = 1;
          for (const l of lobes) {
            const dx = x - l.c[0], dy = y - l.c[1], dz = z - l.c[2];
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            nearEdge = Math.min(nearEdge, d / l.r);
          }
          sizes[idx] = 1.4 + (1 - nearEdge) * 4.5 + Math.random() * 1.2;
          seeds[idx] = Math.random() * Math.PI * 2;
          idx++;
        }
      }

      // --- Soft round dot texture (canvas radial gradient) ---
      const dotCanvas = document.createElement('canvas');
      dotCanvas.width = dotCanvas.height = 64;
      const dctx = dotCanvas.getContext('2d')!;
      const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.45, 'rgba(0,0,0,0.85)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = grad;
      dctx.fillRect(0, 0, 64, 64);
      const dotTex = new THREE.CanvasTexture(dotCanvas);

      // --- Geometry ---
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geom.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));

      // --- Detect theme for particle color ---
      function isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') !== 'light';
      }

      // ShaderMaterial with per-particle size, wobble, and explode
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTex: { value: dotTex },
          uPx: { value: Math.min(2, window.devicePixelRatio) },
          uExplode: { value: 0 },
          uTime: { value: 0 },
          uDark: { value: isDarkTheme() ? 1.0 : 0.0 },
        },
        vertexShader: `
          attribute float size;
          attribute float seed;
          uniform float uPx;
          uniform float uExplode;
          uniform float uTime;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            float L = length(p) + 0.0001;
            vec3 dir = p / L;
            p += dir * uExplode * 0.9;
            p.x += sin(uTime * 0.6 + seed) * 0.05 * (0.4 + uExplode);
            p.y += cos(uTime * 0.5 + seed * 1.3) * 0.04 * (0.4 + uExplode);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = size * uPx * (55.0 / -mv.z);
            vAlpha = 0.55 + 0.35 * sin(uTime * 0.8 + seed);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTex;
          uniform float uDark;
          varying float vAlpha;
          void main() {
            vec4 t = texture2D(uTex, gl_PointCoord);
            if (t.a < 0.05) discard;
            // dark theme: white dots, light theme: black dots
            vec3 col = mix(vec3(0.0), vec3(1.0), uDark);
            gl_FragColor = vec4(col, t.a * vAlpha);
          }
        `,
      });

      const points = new THREE.Points(geom, mat);
      scene.add(points);

      // --- Interaction state ---
      let targetExplode = 0;
      let curExplode = 0;
      let rotX = -0.05, rotY = 0.0;
      let tRotX = rotX, tRotY = rotY;
      let dragging = false, lx = 0, ly = 0;

      const onMouseDown = (e: MouseEvent) => {
        dragging = true;
        lx = e.clientX;
        ly = e.clientY;
        targetExplode = 1;
      };
      const onMouseUp = () => {
        dragging = false;
        targetExplode = 0;
      };
      const onMouseMove = (e: MouseEvent) => {
        if (dragging) {
          tRotY += (e.clientX - lx) * 0.005;
          tRotX += (e.clientY - ly) * 0.005;
          lx = e.clientX;
          ly = e.clientY;
        }
      };
      const onMouseEnter = () => {
        targetExplode = Math.max(targetExplode, 0.4);
      };
      const onMouseLeave = () => {
        if (!dragging) targetExplode = 0;
      };

      // Touch
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches[0]) {
          dragging = true;
          lx = e.touches[0].clientX;
          ly = e.touches[0].clientY;
          targetExplode = 0.7;
        }
      };
      const onTouchMove = (e: TouchEvent) => {
        if (dragging && e.touches[0]) {
          tRotY += (e.touches[0].clientX - lx) * 0.005;
          tRotX += (e.touches[0].clientY - ly) * 0.005;
          lx = e.touches[0].clientX;
          ly = e.touches[0].clientY;
        }
      };
      const onTouchEnd = () => {
        dragging = false;
        targetExplode = 0;
      };

      container!.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
      container!.addEventListener('mouseenter', onMouseEnter);
      container!.addEventListener('mouseleave', onMouseLeave);
      container!.addEventListener('touchstart', onTouchStart, { passive: true });
      container!.addEventListener('touchmove', onTouchMove, { passive: true });
      container!.addEventListener('touchend', onTouchEnd);

      // --- Theme observer ---
      const themeObs = new MutationObserver(() => {
        mat.uniforms.uDark!.value = isDarkTheme() ? 1.0 : 0.0;
      });
      themeObs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });

      // --- Resize ---
      const ro = new ResizeObserver(() => {
        const w2 = container!.clientWidth;
        const h2 = container!.clientHeight;
        camera.aspect = w2 / h2;
        camera.updateProjectionMatrix();
        renderer.setSize(w2, h2);
        mat.uniforms.uPx!.value = Math.min(2, window.devicePixelRatio);
      });
      ro.observe(container!);

      // --- Animation ---
      const clock = new THREE.Clock();

      function animate() {
        if (disposed) return;
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        curExplode += (targetExplode - curExplode) * 0.05;
        rotX += (tRotX - rotX) * 0.08;
        rotY += (tRotY - rotY) * 0.08;
        if (!dragging) {
          tRotY += 0.0008;
        }

        points.rotation.x = rotX;
        points.rotation.y = rotY;
        mat.uniforms.uExplode!.value = curExplode;
        mat.uniforms.uTime!.value = t;

        renderer.render(scene, camera);
      }
      animate();

      return () => {
        themeObs.disconnect();
        ro.disconnect();
        container!.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
        container!.removeEventListener('mouseenter', onMouseEnter);
        container!.removeEventListener('mouseleave', onMouseLeave);
        container!.removeEventListener('touchstart', onTouchStart);
        container!.removeEventListener('touchmove', onTouchMove);
        container!.removeEventListener('touchend', onTouchEnd);
      };
    }

    const cleanup = init();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup.then(fn => fn?.());
      renderer?.dispose();
      if (container && renderer?.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: 'grab',
        userSelect: 'none',
      }}
    />
  );
}
