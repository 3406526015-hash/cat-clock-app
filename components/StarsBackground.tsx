
import React, { useEffect, useRef } from 'react';

const StarsBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: { x: number; y: number; radius: number; alpha: number; delta: number }[] = [];
    const numStars = 200;

    const setup = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          alpha: Math.random(),
          delta: Math.random() * 0.5 - 0.25,
        });
      }
    };

    const draw = () => {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            if (!ctx) return;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            ctx.fill();
            star.alpha += star.delta;
            if (star.alpha <= 0 || star.alpha >= 1) {
            star.delta = -star.delta;
            }
        });
        requestAnimationFrame(draw);
    };

    setup();
    const animationFrameId = requestAnimationFrame(draw);

    const handleResize = () => setup();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 w-full h-full" />;
};

export default StarsBackground;
