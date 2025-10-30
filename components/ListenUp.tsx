import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode } from '../utils/audioUtils';
import { Volume2Icon, Loader2Icon, PlayIcon } from './icons';

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ListenUp: React.FC = () => {
    const [text, setText] = useState<string>('小主人，是时候休息一下啦！伸个懒腰，喝点水，让眼睛放松一下吧。');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);


    const generateAndPlaySpeech = useCallback(async () => {
        if (!text) {
            setError('请输入要朗读的文本。');
            return;
        }
        setLoading(true);
        setError(null);
        setIsPlaying(false);

        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                throw new Error("API未返回音频数据。");
            }

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioContext = audioContextRef.current;
            await audioContext.resume();

            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                audioContext,
                24000,
                1,
            );
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.onended = () => setIsPlaying(false);
            source.start();
            audioSourceRef.current = source;
            setIsPlaying(true);

        } catch (e) {
            setError(e instanceof Error ? e.message : '发生未知错误。');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [text]);

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">听我说</h2>
                <p className="text-slate-500 dark:text-slate-400">让您的眼睛休息一下。输入任何文本，听听自然的人声朗读。</p>
            </div>
            
            <div className="flex flex-col flex-grow gap-4">
                <textarea
                    rows={8}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="输入要朗读的文本..."
                />
                <button
                    onClick={generateAndPlaySpeech}
                    disabled={loading || isPlaying}
                    className="w-full sm:w-auto self-start flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-md font-semibold hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2Icon className="animate-spin" /> : (isPlaying ? <Volume2Icon /> : <PlayIcon/>)}
                    {loading ? '生成中...' : (isPlaying ? '播放中...' : '朗读文本')}
                </button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                
                <div className="flex-grow mt-4 bg-slate-200 dark:bg-slate-800/50 rounded-lg p-4 flex items-center justify-center">
                     <div className="text-center text-slate-500 dark:text-slate-400">
                        <Volume2Icon className={`w-16 h-16 mx-auto mb-2 transition-transform ${isPlaying ? 'scale-110 text-orange-500' : ''}`} />
                        <p>{isPlaying ? "正在播放..." : "准备朗读"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListenUp;
