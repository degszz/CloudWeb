'use client';

import { useEffect, useRef } from 'react';

/**
 * Hero 3D scene — nube de partículas flotante.
 * Las partículas se distribuyen en forma de nube (múltiples elipsoides superpuestas).
 * Interactivo: sigue al mouse, se puede arrastrar.
 */
export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let THREE: typeof import('three');
    let renderer: import('three').WebGLRenderer;
    let raf: number;

    async function init() {
      THREE = await import('three');

      const W = container!.clientWidth;
      const H = container!.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
      camera.position.set(0, 0, 7);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      container!.appendChild(renderer.domElement);

      // --- Cloud: particles distributed in cloud formation ---
      const cloudGroup = new THREE.Group();

      // Cloud lobes: [cx, cy, cz, rx, ry, rz, count]
      // Each lobe is an ellipsoid of particles
      const lobes: [number, number, number, number, number, number, number][] = [
        [0,    0,    0,   1.6, 0.8, 0.9, 600],   // main body
        [-1.2, 0.4,  0,   1.0, 0.7, 0.7, 300],   // left bump
        [1.1,  0.35, 0,   1.1, 0.75, 0.7, 320],  // right bump
        [-0.3, 0.8,  0,   0.8, 0.5, 0.6, 200],   // top-left
        [0.5,  0.85, 0,   0.7, 0.45, 0.55, 180], // top-right
        [0,    1.0,  0,   0.5, 0.35, 0.4, 120],   // crown
        [-1.8, 0.0,  0,   0.5, 0.4, 0.5, 100],   // far left
        [1.7,  0.05, 0,   0.55, 0.45, 0.5, 110],  // far right
        [0,   -0.15, 0.5, 1.2, 0.5, 0.4, 200],   // front depth
        [0,   -0.1, -0.5, 1.2, 0.5, 0.4, 200],   // back depth
      ];

      const totalPoints = lobes.reduce((sum, l) => sum + l[6], 0);
      const positions = new Float32Array(totalPoints * 3);
      const sizes = new Float32Array(totalPoints);
      let idx = 0;

      for (const [cx, cy, cz, rx, ry, rz, count] of lobes) {
        for (let i = 0; i < count; i++) {
          // Uniform distribution inside ellipsoid
          const u = Math.random();
          const v = Math.random();
          const w = Math.random();
          const theta = u * 2 * Math.PI;
          const phi = Math.acos(2 * v - 1);
          const r = Math.cbrt(w); // cube root for uniform volume distribution

          const x = cx + rx * r * Math.sin(phi) * Math.cos(theta);
          const y = cy + ry * r * Math.sin(phi) * Math.sin(theta);
          const z = cz + rz * r * Math.cos(phi);

          positions[idx * 3] = x;
          positions[idx * 3 + 1] = y;
          positions[idx * 3 + 2] = z;

          // Vary size: denser near center, smaller near edges
          sizes[idx] = (1 - r * 0.7) * (0.02 + Math.random() * 0.025);
          idx++;
        }
      }

      const cloudGeo = new THREE.BufferGeometry();
      cloudGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      cloudGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const cloudMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.03,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        depthWrite: false,
      });
      const cloudPoints = new THREE.Points(cloudGeo, cloudMat);
      cloudGroup.add(cloudPoints);

      // Outline wireframe: soft contour rings for structure
      const outlineLobes: [number, number, number, number][] = [
        [0, 0, 0, 1.6],
        [-1.1, 0.35, 0, 1.0],
        [1.0, 0.3, 0, 1.05],
        [-0.3, 0.75, 0, 0.75],
        [0.4, 0.8, 0, 0.65],
      ];
      outlineLobes.forEach(([ox, oy, oz, or]) => {
        const ring = new THREE.RingGeometry(or * 0.95, or, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.06,
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ring, ringMat);
        ringMesh.position.set(ox, oy, oz);
        cloudGroup.add(ringMesh);
      });

      scene.add(cloudGroup);

      // Background particles (ambient dust)
      const bgCount = 80;
      const bgGeo = new THREE.BufferGeometry();
      const bgPos = new Float32Array(bgCount * 3);
      for (let i = 0; i < bgCount; i++) {
        bgPos[i * 3]     = (Math.random() - 0.5) * 14;
        bgPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
        bgPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      }
      bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
      const bgMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.015,
        transparent: true,
        opacity: 0.25,
      });
      scene.add(new THREE.Points(bgGeo, bgMat));

      // Mouse interaction
      let targetX = 0, targetY = 0;
      let currentX = 0, currentY = 0;
      let isDragging = false;
      let lastMX = 0, lastMY = 0;
      let velocityX = 0, velocityY = 0;

      const onMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          velocityX += (e.clientX - lastMX) * 0.008;
          velocityY += (e.clientY - lastMY) * 0.008;
          lastMX = e.clientX;
          lastMY = e.clientY;
        } else {
          const rect = container!.getBoundingClientRect();
          targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.0;
          targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 1.0;
        }
      };
      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        lastMX = e.clientX;
        lastMY = e.clientY;
      };
      const onMouseUp = () => { isDragging = false; };

      const onTouchMove = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        const rect = container!.getBoundingClientRect();
        targetX = ((t.clientX - rect.left) / rect.width - 0.5) * 0.8;
        targetY = -((t.clientY - rect.top) / rect.height - 0.5) * 0.8;
      };

      container!.addEventListener('mousemove', onMouseMove);
      container!.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      container!.addEventListener('touchmove', onTouchMove, { passive: true });

      let t = 0;
      function animate() {
        raf = requestAnimationFrame(animate);
        t += 0.005;

        currentX += (targetX - currentX) * 0.03;
        currentY += (targetY - currentY) * 0.03;

        if (isDragging) {
          cloudGroup.rotation.y += velocityX;
          cloudGroup.rotation.x += velocityY;
          velocityX *= 0.93;
          velocityY *= 0.93;
        } else {
          cloudGroup.rotation.y = t * 0.12 + currentX * 0.5;
          cloudGroup.rotation.x = currentY * 0.3;
          cloudGroup.position.y = Math.sin(t * 0.7) * 0.1;
        }

        renderer.render(scene, camera);
      }
      animate();

      const ro = new ResizeObserver(() => {
        const W2 = container!.clientWidth;
        const H2 = container!.clientHeight;
        camera.aspect = W2 / H2;
        camera.updateProjectionMatrix();
        renderer.setSize(W2, H2);
      });
      ro.observe(container!);

      return () => {
        ro.disconnect();
        container!.removeEventListener('mousemove', onMouseMove);
        container!.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        container!.removeEventListener('touchmove', onTouchMove);
      };
    }

    const cleanup = init();

    return () => {
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
