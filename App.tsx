import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, TodoList, CatOverlay, My } from './components';
import { TimerIcon, ListIcon, MinimizeIcon, UserIcon, CatIcon } from './components/icons';

type View = 'timer' | 'todo' | 'my';

function App() {
  const [view, setView] = useState<View>('timer');
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Customization State
  const [customBackground, setCustomBackground] = useState<string | null>(() => localStorage.getItem('customBackground'));
  const [customCatImage, setCustomCatImage] = useState<string | null>(() => localStorage.getItem('customCatImage'));
  const [overlayOpacity, setOverlayOpacity] = useState<number>(() => parseFloat(localStorage.getItem('overlayOpacity') || '0.75'));

  // Lifted Timer State
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isMinimizedWiggling, setIsMinimizedWiggling] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  
  // --- Minimized State & Drag Logic ---
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 96, 
    y: window.innerHeight - 96 
  });
  const dragInfo = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false,
  });

  // Effect for managing customizations in localStorage
  useEffect(() => {
    if (customBackground) localStorage.setItem('customBackground', customBackground);
    else localStorage.removeItem('customBackground');
    
    if (customCatImage) localStorage.setItem('customCatImage', customCatImage);
    else localStorage.removeItem('customCatImage');
    
    localStorage.setItem('overlayOpacity', String(overlayOpacity));

    // Also manage body class for default background
    if (customBackground) {
      document.body.classList.remove('bg-orange-50', 'dark:bg-slate-900');
    } else {
      document.body.classList.add('bg-orange-50', 'dark:bg-slate-900');
    }
  }, [customBackground, customCatImage, overlayOpacity]);

  // Effect for system notifications permission
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  // Effect for timer countdown logic
  useEffect(() => {
    if (isTimerActive && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isTimerActive && secondsLeft <= 0) {
      if(intervalRef.current) clearInterval(intervalRef.current);
      setIsTimerActive(false);
      handleTimeUp();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTimerActive, secondsLeft]);

  // Effect to update timer display when inputs change while paused
  useEffect(() => {
    if (!isTimerActive) {
        const newTotalSeconds = (minutes * 60) + seconds;
        setInitialTime(newTotalSeconds);
        setSecondsLeft(newTotalSeconds);
    }
  }, [minutes, seconds, isTimerActive]);


  const handleTimeUp = () => {
    if (isMinimized) {
      setIsMinimizedWiggling(true);
    } else {
      setIsBreakActive(true);
    }
    if (Notification.permission === 'granted') {
      new Notification("时间到！", {
        body: "小主人，该休息啦～动一动，喝口水，看远方喵～🐾",
        icon: '/favicon.ico'
      });
    }
  };
  
  const handleStartPause = () => {
    if (initialTime > 0) {
        setIsTimerActive(!isTimerActive);
        setIsMinimizedWiggling(false);
    }
  };

  const handleReset = () => {
    setIsTimerActive(false);
    const newTotalSeconds = (minutes * 60) + seconds;
    setSecondsLeft(newTotalSeconds);
    setIsMinimizedWiggling(false);
  };
  
  const handleDismissOverlay = () => setIsBreakActive(false);
  
  const handleMinimize = () => setIsMinimized(true);
  
  const handleMaximize = useCallback(() => {
    if (isMinimizedWiggling) {
      setIsBreakActive(true);
      setIsMinimizedWiggling(false);
    }
    setIsMinimized(false);
  }, [isMinimizedWiggling]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMinimized) return;
    e.preventDefault();
    const info = dragInfo.current;
    info.moved = false;
    info.startX = e.clientX;
    info.startY = e.clientY;
    info.initialX = position.x;
    info.initialY = position.y;
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        const info = dragInfo.current;
        const dx = e.clientX - info.startX;
        const dy = e.clientY - info.startY;

        if (!info.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            info.moved = true;
        }

        const catSize = 64; // w-16
        let newX = info.initialX + dx;
        let newY = info.initialY + dy;
        
        newX = Math.max(0, Math.min(newX, window.innerWidth - catSize));
        newY = Math.max(0, Math.min(newY, window.innerHeight - catSize));

        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        if (!dragInfo.current.moved) {
            handleMaximize();
        }
        setIsDragging(false);
    };

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMaximize]);


  const appStyle: React.CSSProperties = {
      backgroundImage: customBackground ? `url(${customBackground})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
  };

  if (isMinimized) {
    appStyle.left = `${position.x}px`;
    appStyle.top = `${position.y}px`;
  }

  const overlayStyle: React.CSSProperties = {
    backgroundColor: customBackground ? `rgba(255, 247, 237, ${overlayOpacity})` : undefined,
  };
  
  const renderView = () => {
    switch (view) {
      case 'timer':
        return <Timer 
                  minutes={minutes}
                  seconds={seconds}
                  setMinutes={setMinutes}
                  setSeconds={setSeconds}
                  secondsLeft={secondsLeft}
                  initialTime={initialTime}
                  isActive={isTimerActive}
                  onStartPause={handleStartPause}
                  onReset={handleReset}
                  customCatImage={customCatImage} 
                />;
      case 'todo':
        return <TodoList />;
      case 'my':
        return <My 
                currentBackground={customBackground}
                currentCatImage={customCatImage}
                onBackgroundChange={setCustomBackground}
                onCatImageChange={setCustomCatImage}
                overlayOpacity={overlayOpacity}
                onOverlayOpacityChange={setOverlayOpacity}
               />;
      default:
        return null;
    }
  };

  const NavButton: React.FC<{ targetView: View; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; }> = ({ targetView, label, icon: Icon }) => (
    <button
      onClick={() => setView(targetView)}
      className={`flex-1 flex flex-col items-center justify-center p-2 text-sm transition-colors ${ view === targetView ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400 hover:text-orange-500' }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span>{label}</span>
    </button>
  );

  const maximizedClasses = 'flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl rounded-lg';
  const minimizedClasses = 'fixed w-16 h-16 rounded-full shadow-lg cursor-grab active:cursor-grabbing';

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
      <div 
        onMouseDown={handleMouseDown}
        style={appStyle} 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isMinimized ? minimizedClasses : maximizedClasses} ${!customBackground ? 'bg-orange-50 dark:bg-slate-900' : ''} text-slate-800 dark:text-slate-200`}
      >
        <div 
          style={overlayStyle} 
          className={`w-full h-full transition-opacity duration-500 ${isMinimized ? (isMinimizedWiggling ? 'animate-wiggle' : '') : ''}`}
        >
          {isMinimized ? (
            <div className="w-full h-full bg-orange-400 text-white flex items-center justify-center">
              {customCatImage ? (
                  <img src={customCatImage} alt="猫咪头像" className="w-full h-full object-cover" />
              ) : (
                  <CatIcon className="w-8 h-8" />
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <header className="flex-shrink-0 flex items-center justify-center p-4 relative">
                <h1 className="text-2xl font-bold tracking-wider text-orange-500">猫猫钟</h1>
                <button 
                  onClick={handleMinimize} 
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-orange-500 transition-colors"
                  aria-label="最小化应用"
                >
                  <MinimizeIcon className="w-6 h-6" />
                </button>
              </header>

              <main className="flex-grow flex flex-col items-center justify-center p-4 overflow-y-auto">
                {renderView()}
              </main>

              <footer className="flex-shrink-0 w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700">
                <nav className="flex justify-around p-1">
                  <NavButton targetView="timer" label="专注时钟" icon={TimerIcon} />
                  <NavButton targetView="todo" label="待办事项" icon={ListIcon} />
                  <NavButton targetView="my" label="我的" icon={UserIcon} />
                </nav>
              </footer>
              
              {isBreakActive && <CatOverlay onDismiss={handleDismissOverlay} imageUrl={customCatImage} />}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;