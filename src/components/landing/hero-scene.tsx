'use client';

import { useEffect, useRef } from 'react';

/**
 * Hero 3D scene — Three.js cloud wireframe flotando.
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
      camera.position.set(0, 0, 6);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      container!.appendChild(renderer.domElement);

      // --- Cloud shape: cluster of spheres forming a cloud silhouette ---
      const cloudGroup = new THREE.Group();

      // Cloud lobe positions (x, y, z, radius)
      const lobes: [number, number, number, number][] = [
        [0, 0, 0, 1.2],       // center
        [-1.1, 0.3, 0, 0.9],  // left
        [1.1, 0.2, 0, 1.0],   // right
        [-0.5, 0.7, 0, 0.8],  // top-left
        [0.5, 0.8, 0, 0.75],  // top-right
        [0, 0.95, 0, 0.6],    // top-center
        [-1.6, -0.1, 0, 0.6], // far left
        [1.6, -0.1, 0, 0.65], // far right
        [0, -0.3, 0.4, 0.7],  // front
        [0, -0.2, -0.4, 0.7], // back
      ];

      // Wireframe lobes
      lobes.forEach(([x, y, z, r]) => {
        const geo = new THREE.SphereGeometry(r, 12, 10);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.12,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        cloudGroup.add(mesh);
      });

      // Soft inner core (larger, very low opacity)
      const coreGeo = new THREE.SphereGeometry(1.4, 16, 14);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.04,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 0.2, 0);
      cloudGroup.add(core);

      // Flat bottom — subtle line to ground the cloud
      const bottomGeo = new THREE.PlaneGeometry(3.4, 0.01, 20, 1);
      const bottomMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      });
      const bottom = new THREE.Mesh(bottomGeo, bottomMat);
      bottom.position.set(0, -0.5, 0);
      cloudGroup.add(bottom);

      scene.add(cloudGroup);

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
          cloudGroup.rotation.y += velocityX;
          cloudGroup.rotation.x += velocityY;
          velocityX *= 0.92;
          velocityY *= 0.92;
        } else {
          cloudGroup.rotation.y = t * 0.15 + currentX * 0.6;
          cloudGroup.rotation.x = currentY * 0.4;
          // Gentle bob
          cloudGroup.position.y = Math.sin(t * 0.8) * 0.08;
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
