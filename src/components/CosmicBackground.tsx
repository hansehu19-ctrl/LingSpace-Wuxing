import React, { useEffect, useRef } from 'react';
import { SceneSetting } from '../types';

interface CosmicBackgroundProps {
  scene: SceneSetting;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ scene }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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

    // Stars collection
    const starCount = Math.min(120, Math.floor((width * height) / 8000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      color: Math.random() > 0.8 ? '#a7f3d0' : Math.random() > 0.6 ? '#93c5fd' : '#e0e7ff',
    }));

    // Occasional shooting meteor
    let meteor: { x: number; y: number; length: number; speed: number; angle: number; alpha: number } | null = null;
    let meteorCooldown = 150;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint glowing nebula clouds
      const grad1 = ctx.createRadialGradient(width * 0.3, height * 0.2, 50, width * 0.3, height * 0.2, width * 0.6);
      grad1.addColorStop(0, scene.ambientLight);
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.7, height * 0.8, 80, width * 0.7, height * 0.8, width * 0.5);
      grad2.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      stars.forEach((star) => {
        star.alpha += Math.sin(Date.now() * star.pulseSpeed) * 0.008;
        const currentAlpha = Math.max(0.15, Math.min(0.95, star.alpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowBlur = star.radius * 3;
        ctx.shadowColor = star.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Handle shooting meteor
      meteorCooldown--;
      if (meteorCooldown <= 0 && !meteor && Math.random() < 0.03) {
        meteor = {
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.3,
          length: Math.random() * 80 + 60,
          speed: Math.random() * 12 + 10,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
          alpha: 1,
        };
        meteorCooldown = 240 + Math.random() * 300;
      }

      if (meteor) {
        ctx.save();
        ctx.beginPath();
        const tailX = meteor.x - Math.cos(meteor.angle) * meteor.length;
        const tailY = meteor.y - Math.sin(meteor.angle) * meteor.length;

        const meteorGrad = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
        meteorGrad.addColorStop(0, 'transparent');
        meteorGrad.addColorStop(1, `rgba(224, 231, 255, ${meteor.alpha})`);

        ctx.strokeStyle = meteorGrad;
        ctx.lineWidth = 1.6;
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(meteor.x, meteor.y);
        ctx.stroke();

        // Glowing head
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${meteor.alpha})`;
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();

        meteor.x += Math.cos(meteor.angle) * meteor.speed;
        meteor.y += Math.sin(meteor.angle) * meteor.speed;
        meteor.alpha -= 0.025;

        if (meteor.alpha <= 0 || meteor.x > width || meteor.y > height) {
          meteor = null;
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [scene]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 transition-colors duration-1000 bg-gradient-to-b ${scene.bgGradient}`}>
      <canvas ref={canvasRef} className="w-full h-full opacity-90" />
    </div>
  );
};
