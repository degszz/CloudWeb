'use client';

import { useEffect, useRef } from 'react';

/**
 * Hero 3D scene — Three.js icosahedron wireframe flotando.
 * Interactivo: sigue al mouse con suavidad, se puede arrastrar.
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

      // Scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
      camera.position.set(0, 0, 5);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      container!.appendChild(renderer.domElement);

      // Icosahedron — wireframe grueso
      const geo = new THREE.IcosahedronGeometry(1.5, 1);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      // Inner sphere
      const innerGeo = new THREE.SphereGeometry(0.9, 16, 16);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      scene.add(inner);

      // Particles
      const pCount = 120;
      const pGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02,
        transparent: true,
        opacity: 0.35,
      });
      scene.add(new THREE.Points(pGeo, pMat));

      // Mouse interaction
      let targetX = 0, targetY = 0;
      let currentX = 0, currentY = 0;
      let isDragging = false;
      let lastMX = 0, lastMY = 0;
      let velocityX = 0, velocityY = 0;

      const onMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          velocityX += (e.clientX - lastMX) * 0.01;
          velocityY += (e.clientY - lastMY) * 0.01;
          lastMX = e.clientX;
          lastMY = e.clientY;
        } else {
          const rect = container!.getBoundingClientRect();
          targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.2;
          targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 1.2;
        }
      };
      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        lastMX = e.clientX;
        lastMY = e.clientY;
      };
      const onMouseUp = () => { isDragging = false; };

      // Touch
      const onTouchMove = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        const rect = container!.getBoundingClientRect();
        targetX = ((t.clientX - rect.left) / rect.width - 0.5) * 1.0;
        targetY = -((t.clientY - rect.top) / rect.height - 0.5) * 1.0;
      };

      container!.addEventListener('mousemove', onMouseMove);
      container!.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      container!.addEventListener('touchmove', onTouchMove, { passive: true });

      let t = 0;
      function animate() {
        raf = requestAnimationFrame(animate);
        t += 0.006;

        currentX += (targetX - currentX) * 0.04;
        currentY += (targetY - currentY) * 0.04;

        if (isDragging) {
          mesh.rotation.y += velocityX;
          mesh.rotation.x += velocityY;
          inner.rotation.y += velocityX * 0.6;
          inner.rotation.x += velocityY * 0.6;
          velocityX *= 0.92;
          velocityY *= 0.92;
        } else {
          mesh.rotation.y = t * 0.22 + currentX * 0.8;
          mesh.rotation.x = currentY * 0.8;
          inner.rotation.y = -t * 0.14;
          inner.rotation.x = t * 0.09;
        }

        renderer.render(scene, camera);
      }
      animate();

      // Resize
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
