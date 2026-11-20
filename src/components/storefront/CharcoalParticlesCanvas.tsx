import React, { useEffect, useRef } from 'react';

interface EmberParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  driftAmplitude: number;
  driftFrequency: number;
  phase: number;
  alpha: number;
  hue: 'gold' | 'amber' | 'crimson';
}

interface CharcoalParticlesCanvasProps {
  className?: string;
}

export const CharcoalParticlesCanvas: React.FC<CharcoalParticlesCanvasProps> = ({
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let rafId = 0;
    const particles: EmberParticle[] = [];

    const createParticle = (spawnAtBottom = false): EmberParticle => {
      const rand = Math.random();
      const hue: EmberParticle['hue'] =
        rand < 0.72 ? 'gold' : rand < 0.92 ? 'amber' : 'crimson';
      return {
        x: Math.random() * Math.max(width, 320),
        y: spawnAtBottom ? height + Math.random() * 40 : Math.random() * Math.max(height, 400),
        radius: 1.0 + Math.random() * 2.4,
        speedY: 0.25 + Math.random() * 0.65,
        driftAmplitude: 8 + Math.random() * 18,
        driftFrequency: 0.008 + Math.random() * 0.015,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.22 + Math.random() * 0.58,
        hue,
      };
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const nextWidth = parent ? parent.clientWidth : window.innerWidth;
      const nextHeight = parent ? parent.clientHeight : 640;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = width < 640 ? 28 : 54;
      while (particles.length < targetCount) {
        particles.push(createParticle(false));
      }
      if (particles.length > targetCount) {
        particles.length = targetCount;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const drawParticles = (tick: number) => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (!prefersReducedMotion) {
          p.y -= p.speedY;
          if (p.y < -20) {
            particles[i] = createParticle(true);
            continue;
          }
        }

        const heightRatio = Math.max(0, Math.min(1, p.y / Math.max(1, height)));
        const fadeEdge = Math.min(1, heightRatio * 2.2) * Math.min(1, (1 - heightRatio) * 3.5 + 0.15);
        const currentAlpha = p.alpha * fadeEdge;
        const swayX = p.x + Math.sin(tick * p.driftFrequency + p.phase) * p.driftAmplitude;

        const color =
          p.hue === 'gold'
            ? `rgba(229, 184, 105, ${currentAlpha.toFixed(3)})`
            : p.hue === 'amber'
            ? `rgba(245, 158, 11, ${(currentAlpha * 0.85).toFixed(3)})`
            : `rgba(220, 68, 55, ${(currentAlpha * 0.72).toFixed(3)})`;

        const glowRadius = p.radius * 4.2;
        const grad = ctx.createRadialGradient(swayX, p.y, 0, swayX, p.y, glowRadius);
        grad.addColorStop(0, color);
        grad.addColorStop(0.45, color);
        grad.addColorStop(1, 'rgba(229, 184, 105, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(swayX, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.hue === 'crimson' ? 'rgba(255, 180, 140, 0.85)' : 'rgba(255, 245, 214, 0.9)';
        ctx.beginPath();
        ctx.arc(swayX, p.y, p.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let tick = 0;
    if (prefersReducedMotion) {
      drawParticles(0);
    } else {
      const render = () => {
        tick += 1;
        drawParticles(tick);
        rafId = window.requestAnimationFrame(render);
      };
      rafId = window.requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    />
  );
};
