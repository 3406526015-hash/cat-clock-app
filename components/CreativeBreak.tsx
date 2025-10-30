import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ImageIcon, Loader2Icon } from './icons';

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

const CreativeBreak: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('一只可爱的小猫在书桌上伸懒腰，卡通风格');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const generateImage = useCallback(async () => {
        if (!prompt) {
            setError('请输入提示词。');
            return;
        }
        setLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png',
                    aspectRatio: aspectRatio,
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                setGeneratedImage(imageUrl);
            } else {
                setError('图片生成失败，未返回任何图片。');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : '发生未知错误。');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [prompt, aspectRatio]);
    
    const aspectRatios: AspectRatio[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">创意时刻</h2>
                <p className="text-slate-500 dark:text-slate-400">释放您的想象力。描述任何事物，我们将其变为现实。</p>
            </div>
            
            <div className="flex-grow flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/3 flex flex-col gap-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">您的提示词</label>
                        <textarea
                            id="prompt"
                            rows={5}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="例如：一座遥远星球上的未来城市"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">宽高比</label>
                        <div className="grid grid-cols-3 gap-2">
                            {aspectRatios.map(ratio => (
                                <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`p-2 rounded-md text-sm border transition-colors ${aspectRatio === ratio ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={generateImage}
                        disabled={loading}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-md font-semibold hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2Icon className="animate-spin" /> : <ImageIcon />}
                        {loading ? '生成中...' : '生成图片'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                
                <div className="flex-grow lg:w-2/3 bg-slate-200 dark:bg-slate-800/50 rounded-lg flex items-center justify-center p-4 min-h-[300px] lg:min-h-0">
                    {loading && (
                        <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Loader2Icon className="w-8 h-8 animate-spin"/>
                            <p>正在生成您的杰作...</p>
                        </div>
                    )}
                    {!loading && generatedImage && (
                        <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain rounded-md" />
                    )}
                    {!loading && !generatedImage && (
                        <div className="text-center text-slate-500 dark:text-slate-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                            <p>您生成的图片将显示在此处。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreativeBreak;
