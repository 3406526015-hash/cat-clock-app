import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { UploadIcon, WandIcon, Loader2Icon } from './icons';
import { fileToGenerativePart } from '../utils/fileUtils';

const PhotoFun: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('添加复古、老电影滤镜');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setEditedImage(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditImage = useCallback(async () => {
        if (!imageFile || !prompt) {
            setError('请上传一张图片并输入提示词。');
            return;
        }
        setLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const imagePart = await fileToGenerativePart(imageFile);

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        imagePart,
                        { text: prompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const firstPart = response.candidates?.[0]?.content?.parts?.[0];
            if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
                const base64ImageBytes = firstPart.inlineData.data;
                const imageUrl = `data:${firstPart.inlineData.mimeType};base64,${base64ImageBytes}`;
                setEditedImage(imageUrl);
            } else {
                setError('无法从响应中获取编辑后的图片。');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : '发生未知错误。');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [imageFile, prompt]);

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">趣玩图片</h2>
                <p className="text-slate-500 dark:text-slate-400">上传一张照片并描述您的编辑需求。从简单调整到神奇变换。</p>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                    <div 
                        className="h-64 w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer hover:border-orange-500 dark:hover:border-orange-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
                        ) : (
                            <div className="text-center">
                                <UploadIcon className="w-10 h-10 mx-auto mb-2" />
                                <p>点击上传图片</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <textarea
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="例如：让天空看起来像绚烂的日落"
                    />
                    <button
                        onClick={handleEditImage}
                        disabled={loading || !imageFile}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-md font-semibold hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2Icon className="animate-spin" /> : <WandIcon />}
                        {loading ? '施展魔法中...' : '编辑图片'}
                    </button>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="bg-slate-200 dark:bg-slate-800/50 rounded-lg flex items-center justify-center p-4 min-h-[300px] lg:min-h-0">
                    {loading && (
                         <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Loader2Icon className="w-8 h-8 animate-spin"/>
                            <p>正在执行图片魔法...</p>
                        </div>
                    )}
                    {!loading && editedImage && (
                        <img src={editedImage} alt="Edited" className="max-w-full max-h-full object-contain rounded-md" />
                    )}
                    {!loading && !editedImage && (
                        <div className="text-center text-slate-500 dark:text-slate-400">
                            <WandIcon className="w-12 h-12 mx-auto mb-2" />
                            <p>您编辑后的照片将显示在此处。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhotoFun;
