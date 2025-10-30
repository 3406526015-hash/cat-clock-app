import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAiBlob } from '@google/genai';
import { decode, encode, decodeAudioData } from '../utils/audioUtils';
import { MicIcon, SquareIcon, Loader2Icon } from './icons';

type TranscriptionEntry = {
    speaker: 'user' | 'model';
    text: string;
};

const LetsTalk: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isActive, setIsActive] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRefs = useRef<{ input: AudioContext | null, output: AudioContext | null }>({ input: null, output: null });
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    const nextStartTime = useRef(0);
    const audioSources = useRef(new Set<AudioBufferSourceNode>());

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }

        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }

        audioSources.current.forEach(source => source.stop());
        audioSources.current.clear();
        nextStartTime.current = 0;

        setIsActive(false);
        setIsConnecting(false);
    }, []);
    
    const startConversation = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        setTranscriptionHistory([]);
        currentInputTranscription.current = '';
        currentOutputTranscription.current = '';

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            if (!audioContextRefs.current.input) {
                audioContextRefs.current.input = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            if (!audioContextRefs.current.output) {
                audioContextRefs.current.output = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            
            const inputAudioContext = audioContextRefs.current.input;
            const outputAudioContext = audioContextRefs.current.output;
            await inputAudioContext.resume();
            await outputAudioContext.resume();

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsActive(true);
                        
                        mediaStreamSourceRef.current = inputAudioContext.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscription.current;
                            const fullOutput = currentOutputTranscription.current;
                            setTranscriptionHistory(prev => [...prev, {speaker: 'user', text: fullInput}, {speaker: 'model', text: fullOutput}]);
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                        }
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.addEventListener('ended', () => audioSources.current.delete(source));
                            source.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            audioSources.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API 错误:', e);
                        setError(`发生错误: ${e.message}`);
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : '无法开始对话。');
            console.error(e);
            stopConversation();
        }
    }, [stopConversation]);

    function createBlob(data: Float32Array): GenAiBlob {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    }
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopConversation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">聊聊天</h2>
                <p className="text-slate-500 dark:text-slate-400">进行实时语音对话。直接开始说话，Gemini就会回应。</p>
            </div>
            
            <div className="flex flex-col flex-grow gap-4">
                <div className="flex-grow bg-slate-200 dark:bg-slate-800/50 rounded-lg p-4 space-y-4 overflow-y-auto">
                    {transcriptionHistory.length === 0 && (
                        <div className="flex items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                           <p>对话记录将显示在此处。</p>
                        </div>
                    )}
                    {transcriptionHistory.map((entry, index) => (
                        <div key={index} className={`flex flex-col ${entry.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-xl p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-700'}`}>
                                <p className="text-sm">{entry.text}</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{entry.speaker === 'user' ? '您' : 'Gemini'}</p>
                        </div>
                    ))}
                </div>
                
                <div className="flex flex-col items-center gap-4 pt-4">
                    {!isActive && !isConnecting ? (
                        <button onClick={startConversation} className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors">
                           <MicIcon /> 开始对话
                        </button>
                    ) : (
                         <button onClick={stopConversation} disabled={isConnecting} className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400">
                           {isConnecting ? <Loader2Icon className="animate-spin"/> : <SquareIcon />}
                           {isConnecting ? '连接中...' : '结束对话'}
                        </button>
                    )}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default LetsTalk;
