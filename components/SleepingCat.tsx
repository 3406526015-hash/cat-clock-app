import React from 'react';

interface SleepingCatProps extends React.SVGProps<SVGSVGElement> {
  imageUrl: string | null;
}

const SleepingCat: React.FC<SleepingCatProps> = ({ imageUrl, ...props }) => {
  if (imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <style>
          {`
            .custom-cat-breath {
              animation: cat-breath 4s ease-in-out infinite;
              transform-origin: center;
            }
            @keyframes cat-breath {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.04); }
            }
          `}
        </style>
        <img 
          src={imageUrl} 
          alt="睡觉的猫咪" 
          className="custom-cat-breath w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <style>
          {`
            .cat-body {
              animation: cat-breath 4s ease-in-out infinite;
              transform-origin: center;
            }
            .cat-tail {
              animation: tail-wag 3s ease-in-out infinite;
              transform-origin: 20px 90px;
            }
            .cat-zzz {
              animation: zzz-float 2s linear infinite;
              opacity: 0;
            }
            @keyframes cat-breath {
              0%, 100% { transform: scale(1, 1); }
              50% { transform: scale(1.02, 1.04); }
            }
            @keyframes tail-wag {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-15deg); }
            }
            @keyframes zzz-float {
              0% { transform: translate(0, 0); opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { transform: translate(5px, -15px); opacity: 0; }
            }
          `}
        </style>
      </defs>
      <g className="cat-body" fill="#FDBA74">
        {/* Body */}
        <path d="M 20,90 C 20,60 100,60 100,90 C 120,90 120,110 100,110 C 100,130 20,130 20,110 C 0,110 0,90 20,90 Z" />
        {/* Head */}
        <circle cx="90" cy="80" r="30" />
        {/* Ears */}
        <path d="M 70,55 A 10 10 0 0 1 90 55" fill="#FDBA74" />
        <path d="M 95,55 A 10 10 0 0 1 115 55" fill="#FDBA74" />
      </g>
      {/* Tail */}
      <path className="cat-tail" d="M 20,90 C 0,100 -10,80 0,60 C 10,40 25,50 25,65" stroke="#FDBA74" strokeWidth="12" fill="none" strokeLinecap="round" />
      <g fill="#4B5563">
        {/* Eyes */}
        <path d="M 80 80 C 83 83, 87 83, 90 80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 95 80 C 98 83, 102 83, 105 80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Zzz */}
        <text x="105" y="60" fontFamily="monospace" fontSize="8" className="cat-zzz" style={{ animationDelay: '0s' }}>z</text>
        <text x="110" y="55" fontFamily="monospace" fontSize="10" className="cat-zzz" style={{ animationDelay: '0.5s' }}>Z</text>
        <text x="115" y="48" fontFamily="monospace" fontSize="12" className="cat-zzz" style={{ animationDelay: '1s' }}>z</text>
      </g>
    </svg>
  );
};

export default SleepingCat;
