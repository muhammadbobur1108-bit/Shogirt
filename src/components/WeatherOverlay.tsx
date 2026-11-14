import React, { useEffect, useRef } from 'react';

export type WeatherEffect = 'none' | 'rain' | 'sun' | 'wind' | 'snow' | 'holidays' | 'new_year';

interface WeatherOverlayProps {
  effect: WeatherEffect;
}

export default function WeatherOverlay({ effect }: WeatherOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effect === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      angle?: number;
      vAngle?: number;
      length?: number;
      kind?: 'flake' | 'star' | 'spark';
    }

    const particles: Particle[] = [];
    const count =
      effect === 'rain' ? 90 :
      effect === 'snow' ? 70 :
      effect === 'new_year' ? 75 :
      effect === 'holidays' ? 60 :
      effect === 'wind' ? 45 : 30;

    const holidayColors = [
      '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#facc15'
    ];
    const newYearSparkColors = ['#fde047', '#38bdf8', '#f87171', '#34d399', '#ffffff'];

    for (let i = 0; i < count; i++) {
      if (effect === 'rain') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: -1.5 + Math.random() * 0.5,
          vy: 12 + Math.random() * 7,
          length: 14 + Math.random() * 12,
          size: 1 + Math.random() * 0.8,
          color: 'rgba(147, 197, 253, 0.45)',
          alpha: 0.3 + Math.random() * 0.4
        });
      } else if (effect === 'snow') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: -0.8 + Math.random() * 1.6,
          vy: 1.2 + Math.random() * 2.2,
          size: 1.8 + Math.random() * 3.2,
          color: 'rgba(255, 255, 255, 0.75)',
          alpha: 0.4 + Math.random() * 0.5,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.04
        });
      } else if (effect === 'new_year') {
        const rand = Math.random();
        const kind: 'flake' | 'star' | 'spark' = rand < 0.65 ? 'flake' : rand < 0.85 ? 'star' : 'spark';
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: -0.55 + Math.random() * 1.1,
          vy: kind === 'spark' ? 0.9 + Math.random() * 1.4 : 0.7 + Math.random() * 1.6,
          size: kind === 'star' ? 3.5 + Math.random() * 3.5 : kind === 'spark' ? 2 + Math.random() * 2.5 : 1.5 + Math.random() * 2.5,
          color: kind === 'spark'
            ? newYearSparkColors[Math.floor(Math.random() * newYearSparkColors.length)]
            : 'rgba(224, 242, 254, 0.82)',
          alpha: 0.45 + Math.random() * 0.5,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.03,
          kind
        });
      } else if (effect === 'sun') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.4 - Math.random() * 0.8,
          size: 2 + Math.random() * 4,
          color: 'rgba(251, 191, 36, 0.4)',
          alpha: 0.2 + Math.random() * 0.4
        });
      } else if (effect === 'wind') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 4 + Math.random() * 5,
          vy: (Math.random() - 0.5) * 1.2,
          size: 1.5 + Math.random() * 2.5,
          length: 15 + Math.random() * 25,
          color: 'rgba(203, 213, 225, 0.25)',
          alpha: 0.2 + Math.random() * 0.35,
          angle: Math.random() * 0.2
        });
      } else if (effect === 'holidays') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          size: 4 + Math.random() * 6,
          color: holidayColors[Math.floor(Math.random() * holidayColors.length)],
          alpha: 0.7 + Math.random() * 0.3,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.1
        });
      }
    }

    const drawSnowflakeStar = (x: number, y: number, r: number, angle: number, color: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.stroke();
        ctx.rotate(Math.PI / 3);
      }
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (effect === 'sun') {
        const gradient = ctx.createRadialGradient(width - 50, 40, 10, width - 50, 40, 320);
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
        gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      if (effect === 'new_year') {
        const cornerGlow = ctx.createRadialGradient(width - 60, 20, 5, width - 60, 20, 260);
        cornerGlow.addColorStop(0, 'rgba(250, 204, 21, 0.10)');
        cornerGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.05)');
        cornerGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = cornerGlow;
        ctx.fillRect(0, 0, width, height);
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (effect === 'rain') {
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + (p.length || 15));
          ctx.stroke();

          p.x += p.vx;
          p.y += p.vy;

          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          if (p.x < 0) p.x = width;
        } else if (effect === 'snow') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();

          p.x += p.vx + Math.sin(p.angle || 0) * 0.5;
          p.y += p.vy;
          if (p.angle !== undefined && p.vAngle !== undefined) {
            p.angle += p.vAngle;
          }

          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
          if (p.x > width) p.x = 0;
          if (p.x < 0) p.x = width;
        } else if (effect === 'new_year') {
          if (p.kind === 'star') {
            drawSnowflakeStar(p.x, p.y, p.size, p.angle || 0, p.color, p.alpha);
          } else {
            ctx.save();
            ctx.globalAlpha = p.kind === 'spark'
              ? Math.max(0.25, Math.abs(Math.sin((p.angle || 0) * 2)) * p.alpha)
              : p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
          }

          p.x += p.vx + Math.sin(p.angle || 0) * 0.45;
          p.y += p.vy;
          if (p.angle !== undefined && p.vAngle !== undefined) {
            p.angle += p.vAngle;
          }

          if (p.y > height) {
            p.y = -8;
            p.x = Math.random() * width;
          }
          if (p.x > width) p.x = 0;
          if (p.x < 0) p.x = width;
        } else if (effect === 'sun') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();

          p.x += p.vx;
          p.y += p.vy;

          if (p.y < 0) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        } else if (effect === 'wind') {
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + (p.length || 20), p.y + p.vy);
          ctx.stroke();

          p.x += p.vx;
          p.y += p.vy;

          if (p.x > width) {
            p.x = -20;
            p.y = Math.random() * height;
          }
        } else if (effect === 'holidays') {
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.angle !== undefined) ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();

          p.x += p.vx;
          p.y += p.vy;
          if (p.angle !== undefined && p.vAngle !== undefined) {
            p.angle += p.vAngle;
          }

          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [effect]);

  if (effect === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
      style={{ opacity: 0.9 }}
    />
  );
}
