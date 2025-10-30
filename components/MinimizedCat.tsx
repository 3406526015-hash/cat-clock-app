import React, { useState, useRef, MouseEvent } from 'react';
import { CatIcon } from './icons';

interface MinimizedCatProps {
  onClick: () => void;
  imageUrl: string | null;
  isWiggling?: boolean;
}

const MinimizedCat: React.FC<MinimizedCatProps> = ({ onClick, imageUrl, isWiggling }) => {
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 80, 
    y: window.innerHeight - 80 
  });

  const dragInfo = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false,
  });

  const catRef = useRef<HTMLButtonElement>(null);

  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const info = dragInfo.current;
    info.isDragging = true;
    info.moved = false;
    info.startX = e.clientX;
    info.startY = e.clientY;
    info.initialX = position.x;
    info.initialY = position.y;
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    const info = dragInfo.current;
    if (!info.isDragging) return;

    const dx = e.clientX - info.startX;
    const dy = e.clientY - info.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        info.moved = true;
    }

    let newX = info.initialX + dx;
    let newY = info.initialY + dy;
    
    const catSize = 64; // w-16
    newX = Math.max(0, Math.min(newX, window.innerWidth - catSize));
    newY = Math.max(0, Math.min(newY, window.innerHeight - catSize));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    const info = dragInfo.current;
    if (info.isDragging) {
      if (!info.moved) {
        onClick();
      }
      info.isDragging = false;
    }
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
    <style>
      {`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }
      `}
    </style>
    <button
      ref={catRef}
      onMouseDown={handleMouseDown}
      style={{ 
        position: 'fixed', 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        touchAction: 'none'
      }}
      className={`w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-orange-500 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 z-50 cursor-grab active:cursor-grabbing overflow-hidden ${isWiggling ? 'animate-wiggle' : ''}`}
      aria-label="恢复应用"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="猫咪头像" className="w-full h-full object-cover" />
      ) : (
        <CatIcon className="w-8 h-8" />
      )}
    </button>
    </>
  );
};

export default MinimizedCat;