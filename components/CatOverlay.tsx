import React, { useEffect, useState } from 'react';
import { CatIcon } from './icons';

interface CatOverlayProps {
  onDismiss: () => void;
  imageUrl: string | null;
}

const CatOverlay: React.FC<CatOverlayProps> = ({ onDismiss, imageUrl }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300); // Wait for exit animation
  };

  return (
    <div
      onDoubleClick={handleDismiss}
      className={`fixed bottom-5 right-5 z-50 flex items-end gap-2 cursor-pointer transition-all duration-300 ease-in-out transform ${
        isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      }`}
      style={{ animation: 'slideIn 0.5s ease-out forwards' }}
    >
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
      <div className="w-24 h-24 text-orange-500 drop-shadow-lg">
          {imageUrl ? (
            <img src={imageUrl} alt="自定义猫咪" className="w-full h-full object-contain" />
          ) : (
            <CatIcon className="w-full h-full" />
          )}
      </div>
      <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg rounded-bl-none shadow-lg max-w-xs">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          小主人，该休息啦～
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          动一动，喝口水，看远方喵～🐾
        </p>
      </div>
    </div>
  );
};

export default CatOverlay;
