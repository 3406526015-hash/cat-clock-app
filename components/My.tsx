import React, { useRef } from 'react';
import { UploadIcon } from './icons';

interface MyProps {
  currentBackground: string | null;
  currentCatImage: string | null;
  onBackgroundChange: (dataUrl: string | null) => void;
  onCatImageChange: (dataUrl: string | null) => void;
  overlayOpacity: number;
  onOverlayOpacityChange: (opacity: number) => void;
}

const My: React.FC<MyProps> = ({ 
  currentBackground, 
  currentCatImage, 
  onBackgroundChange, 
  onCatImageChange,
  overlayOpacity,
  onOverlayOpacityChange
}) => {
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const catImageInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (dataUrl: string | null) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ImageSettingCard: React.FC<{
    title: string;
    description: string;
    imagePreview: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onReset: () => void;
  }> = ({ title, description, imagePreview, inputRef, onFileChange, onReset }) => (
    <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm">
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{description}</p>
      <div className="flex items-center gap-4">
        <div 
          className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="预览" className="w-full h-full object-cover" />
          ) : (
            <UploadIcon className="w-8 h-8 text-slate-500" />
          )}
          <input type="file" ref={inputRef} onChange={onFileChange} accept="image/*" className="hidden" />
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-md font-semibold hover:bg-orange-600 transition-colors"
          >
            上传图片
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-md font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-lg h-full flex flex-col text-slate-800 dark:text-slate-100">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold">个性化设置</h2>
        <p className="text-slate-500 dark:text-slate-400">打造您专属的猫猫钟。</p>
      </div>
      <div className="space-y-6">
        <ImageSettingCard
          title="自定义背景"
          description="上传一张图片作为您的应用背景。"
          imagePreview={currentBackground}
          inputRef={backgroundInputRef}
          onFileChange={(e) => handleFileChange(e, onBackgroundChange)}
          onReset={() => onBackgroundChange(null)}
        />
        
        {currentBackground && (
          <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-1">背景遮罩不透明度</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">调整内容区域颜色遮罩的不透明度，让背景图片更清晰或更柔和。</p>
             <div className="flex items-center gap-4">
              <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => onOverlayOpacityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer dark:bg-slate-600"
                  style={{
                    background: `linear-gradient(to right, #FDBA74 ${overlayOpacity * 100}%, #d1d5db ${overlayOpacity * 100}%)`
                  }}
              />
              <span className="font-mono text-sm w-10 text-center">{Math.round(overlayOpacity * 100)}%</span>
            </div>
          </div>
        )}

        <ImageSettingCard
          title="自定义猫咪"
          description="上传您的猫咪图片（推荐PNG）。"
          imagePreview={currentCatImage}
          inputRef={catImageInputRef}
          onFileChange={(e) => handleFileChange(e, onCatImageChange)}
          onReset={() => onCatImageChange(null)}
        />
      </div>
    </div>
  );
};

export default My;