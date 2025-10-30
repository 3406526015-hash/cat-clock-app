import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { UploadIcon, VideoIcon, Loader2Icon, AlertTriangleIcon } from './icons';
import { fileToBase64 } from '../utils/fileUtils';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

type AspectRatio = '16:9' | '9:16';

const loadingMessages = [
  "正在将像素酿成杰作...",
  "正在为数字演员编舞...",
  "正在渲染您的电影级愿景...",
  "这可能需要几分钟，请稍候！",
  "导演正在喊 '开拍!'...",
  "正在合成最终镜头...",
];

const VideoMagic: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('这只猫从午睡中慢慢醒来并伸懒腰，场景在阳光普照的房间里，具有电影感。');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageIntervalRef = useRef<number>();

    const checkApiKey = useCallback(async () => {
        try {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
                return hasKey;
            }
        } catch (e) {
            console.error("检查API密钥时出错:", e);
        }
        setApiKeySelected(false);
        return false;
    }, []);
    
    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectApiKey = async () => {
        try {
            if (window.aistudio) {
                await window.aistudio.openSelectKey();
                setApiKeySelected(true); 
                setError(null);
            } else {
                setError("AI Studio 上下文不可用。");
            }
        } catch (e) {
            console.error("打开API密钥选择时出错:", e);
            setError("无法打开API密钥选择对话框。");
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setGeneratedVideo(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const generateVideo = useCallback(async () => {
        if (!imageFile || !prompt) {
            setError('请上传一张图片并输入提示词。');
            return;
        }

        const hasKey = await checkApiKey();
        if (!hasKey) {
            setError('请选择一个API密钥以生成视频。');
            return;
        }

        setLoading(true);
        setError(null);
        setGeneratedVideo(null);
        
        messageIntervalRef.current = window.setInterval(() => {
            setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        }, 3000);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const base64Image = await fileToBase64(imageFile);
            
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                image: {
                    imageBytes: base64Image,
                    mimeType: imageFile.type,
                },
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio,
                }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const response = await fetch(`${downloadLink}&key=${process.env.API_KEY!}`);
                const blob = await response.blob();
                const videoUrl = URL.createObjectURL(blob);
                setGeneratedVideo(videoUrl);
            } else {
                throw new Error("视频生成完成，但未返回视频URI。");
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : '发生未知错误。';
            setError(errorMessage);
            if (errorMessage.includes("Requested entity was not found")) {
                setError("您的API密钥似乎无效。请重新选择。");
                setApiKeySelected(false);
            }
            console.error(e);
        } finally {
            setLoading(false);
            clearInterval(messageIntervalRef.current);
        }
    }, [imageFile, prompt, aspectRatio, checkApiKey]);

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">视频魔法</h2>
                <p className="text-slate-500 dark:text-slate-400">让您的照片动起来。上传图片，描述场景，创作短视频。</p>
            </div>

            {!apiKeySelected && (
                <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-4 rounded-md mb-6 flex items-center gap-4">
                    <AlertTriangleIcon className="w-6 h-6" />
                    <div>
                        <p className="font-semibold">需要API密钥</p>
                        <p className="text-sm">视频生成需要您选择自己的API密钥。费用将计入您的账户。请参阅 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">计费详情</a>。</p>
                        <button onClick={handleSelectApiKey} className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded-md text-sm font-semibold hover:bg-yellow-600">
                            选择API密钥
                        </button>
                    </div>
                </div>
            )}
            
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                    <div 
                        className="h-48 w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer hover:border-orange-500 dark:hover:border-orange-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
                        ) : (
                            <div className="text-center">
                                <UploadIcon className="w-10 h-10 mx-auto mb-2" />
                                <p>点击上传起始图片</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <textarea
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="例如：镜头慢慢拉远"
                    />
                     <div className="flex gap-2">
                        {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`flex-1 p-2 rounded-md text-sm border transition-colors ${aspectRatio === ratio ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {ratio === '16:9' ? '横向' : '纵向'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={generateVideo}
                        disabled={loading || !imageFile || !apiKeySelected}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-md font-semibold hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2Icon className="animate-spin" /> : <VideoIcon />}
                        {loading ? '生成中...' : '生成视频'}
                    </button>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="bg-slate-200 dark:bg-slate-800/50 rounded-lg flex items-center justify-center p-4 min-h-[300px] lg:min-h-0">
                    {loading && (
                         <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400 text-center">
                            <Loader2Icon className="w-8 h-8 animate-spin"/>
                            <p className="font-semibold text-lg">正在创作您的视频...</p>
                            <p className="text-sm">{loadingMessage}</p>
                        </div>
                    )}
                    {!loading && generatedVideo && (
                        <video src={generatedVideo} controls autoPlay loop className="max-w-full max-h-full rounded-md" />
                    )}
                    {!loading && !generatedVideo && (
                        <div className="text-center text-slate-500 dark:text-slate-400">
                            <VideoIcon className="w-12 h-12 mx-auto mb-2" />
                            <p>您生成的视频将显示在此处。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoMagic;
