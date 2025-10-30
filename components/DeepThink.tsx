import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BrainCircuitIcon, Loader2Icon } from './icons';
import { marked } from 'marked';

const DeepThink: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('请像对一个好奇的高中生一样解释广义相对论。请使用类比和简单的例子。');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<string | null>(null);

    const generateResponse = useCallback(async () => {
        if (!prompt) {
            setError('请输入一个问题。');
            return;
        }
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    thinkingConfig: { thinkingBudget: 32768 }
                },
            });
            setResponse(result.text);
        } catch (e) {
            setError(e instanceof Error ? e.message : '发生未知错误。');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [prompt]);

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">深度思考</h2>
                <p className="text-slate-500 dark:text-slate-400">解决您最复杂的问题。由Gemini 2.5 Pro强力驱动，具备最大思考预算以进行深度推理。</p>
            </div>
            
            <div className="flex flex-col flex-grow gap-4">
                <textarea
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="在此输入您的复杂问题..."
                />
                <button
                    onClick={generateResponse}
                    disabled={loading}
                    className="w-full sm:w-auto self-start flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-md font-semibold hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2Icon className="animate-spin" /> : <BrainCircuitIcon />}
                    {loading ? '思考中...' : '思考并生成'}
                </button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="flex-grow mt-4 bg-slate-200 dark:bg-slate-800/50 rounded-lg p-4 min-h-[200px] overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                             <div className="flex flex-col items-center gap-2">
                                <Loader2Icon className="w-8 h-8 animate-spin"/>
                                <p>正在启动深度思考协议...</p>
                            </div>
                        </div>
                    )}
                    {response && (
                         <div
                            className="prose prose-slate dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked(response) as string }}
                        />
                    )}
                    {!loading && !response && (
                         <div className="flex items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                            <p>您查询的回复将显示在此处。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeepThink;
