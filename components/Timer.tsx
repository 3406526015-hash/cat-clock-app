import React from 'react';
import SleepingCat from './SleepingCat';

// Add a style to hide number input arrows
const style = document.createElement('style');
style.textContent = `
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
`;
document.head.appendChild(style);


interface TimerProps {
  minutes: number;
  seconds: number;
  setMinutes: (minutes: number) => void;
  setSeconds: (seconds: number) => void;
  secondsLeft: number;
  initialTime: number;
  isActive: boolean;
  onStartPause: () => void;
  onReset: () => void;
  customCatImage: string | null;
}

const Timer: React.FC<TimerProps> = ({
  minutes,
  seconds,
  setMinutes,
  setSeconds,
  secondsLeft,
  initialTime,
  isActive,
  onStartPause,
  onReset,
  customCatImage,
}) => {
  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      setMinutes(isNaN(val) ? 0 : val);
  }
  
  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
       if (val >= 0 && val <= 59) {
          setSeconds(isNaN(val) ? 0 : val);
      } else if (val > 59) {
          setSeconds(59);
      } else {
          setSeconds(0);
      }
  }

  const progress = initialTime > 0 ? (secondsLeft / initialTime) : 0;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle className="text-slate-200/50 dark:text-slate-700/50" strokeWidth="4" cx="50" cy="50" r="48" fill="transparent" />
          <circle
            className="text-orange-500 transform -rotate-90 origin-center"
            strokeWidth="4"
            strokeDasharray={2 * Math.PI * 48}
            strokeDashoffset={(1 - progress) * (2 * Math.PI * 48)}
            cx="50" cy="50" r="48" fill="transparent"
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
             <div className="w-32 h-32 mb-2 transition-opacity duration-500" style={{opacity: isActive ? 0.5 : 1}}>
                <SleepingCat imageUrl={customCatImage} />
            </div>
            <div className="h-20">
            {isActive ? (
                <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter text-slate-800 dark:text-slate-100">{formatTime(secondsLeft)}</h1>
            ) : (
                <div className="flex items-center text-5xl sm:text-6xl font-bold text-slate-500 dark:text-slate-400">
                    <input type="number" min="0" value={String(minutes).padStart(2, '0')} onChange={handleMinutesChange} className="w-20 bg-transparent text-center outline-none appearance-none" aria-label="分钟"/>
                    <span>:</span>
                    <input type="number" min="0" max="59" value={String(seconds).padStart(2, '0')} onChange={handleSecondsChange} className="w-20 bg-transparent text-center outline-none" aria-label="秒"/>
                </div>
            )}
            </div>
        </div>
      </div>
      <div className="mt-8 flex gap-4">
        <button onClick={onStartPause} disabled={initialTime === 0} className="px-8 py-3 bg-orange-500 text-white rounded-full font-semibold text-lg hover:bg-orange-600 transition-colors shadow-md disabled:bg-orange-300 disabled:cursor-not-allowed">
          {isActive ? '暂停' : '开始'}
        </button>
        <button onClick={onReset} className="px-8 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-full font-semibold text-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shadow-md">
          重置
        </button>
      </div>
    </div>
  );
};

export default Timer;