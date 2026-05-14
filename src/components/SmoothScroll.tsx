"use client";

import React, { useEffect } from 'react';

// Use Lenis via CDN since we can't install npm packages
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if Lenis is already loaded
    if (typeof window === 'undefined') return;

    const initLenis = async () => {
      // Dynamically load Lenis from CDN
      if (!(window as any).Lenis) {
        const script = document.createElement('script');
        script.src = "https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js";
        script.async = true;
        script.onload = () => {
          startLenis();
        };
        document.head.appendChild(script);
      } else {
        startLenis();
      }
    };

    const startLenis = () => {
      const Lenis = (window as any).Lenis;
      if (!Lenis) return;

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      // Store in window for access if needed
      (window as any).lenisInstance = lenis;
    };

    initLenis();

    return () => {
      if ((window as any).lenisInstance) {
        (window as any).lenisInstance.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
