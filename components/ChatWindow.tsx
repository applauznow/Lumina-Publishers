
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role } from '../types';
import { geminiService } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';

interface ChatWindowProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice Refs
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionBufferRef = useRef<{ role: Role; text: string } | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const stopVoiceSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextInRef.current) {
      audioContextInRef.current.close();
      audioContextInRef.current = null;
    }
    if (audioContextOutRef.current) {
      audioContextOutRef.current.close();
      audioContextOutRef.current = null;
    }
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    setIsVoiceActive(false);
  };

  const startVoiceSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = geminiService.getLiveClient();

      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Voice session opened');
            setIsVoiceActive(true);
            
            // Microphone input
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const base64 = geminiService.encodeAudio(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioData = geminiService.decodeAudio(base64Audio);
              const buffer = await geminiService.decodeAudioData(audioData, ctx, 24000, 1);
              
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }

            // Handle Transcriptions to sync with text chat
            if (message.serverContent?.inputTranscription) {
               if (!transcriptionBufferRef.current || transcriptionBufferRef.current.role !== 'user') {
                  transcriptionBufferRef.current = { role: 'user', text: '' };
               }
               transcriptionBufferRef.current.text += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
               if (!transcriptionBufferRef.current || transcriptionBufferRef.current.role !== 'assistant') {
                  transcriptionBufferRef.current = { role: 'assistant', text: '' };
               }
               transcriptionBufferRef.current.text += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete && transcriptionBufferRef.current) {
                const finalMsg = transcriptionBufferRef.current;
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: finalMsg.role,
                  content: finalMsg.text,
                  timestamp: new Date()
                }]);
                transcriptionBufferRef.current = null;
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => s.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopVoiceSession(),
          onerror: (e) => {
            console.error('Voice Error:', e);
            stopVoiceSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }
          },
          systemInstruction: "You are Lumina Assistant. Greet the visitor with a sophisticated voice. Briefly welcome them to the publishing house and ask about their creative project. Be polite, literary, and engaging."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start voice:', err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await geminiService.chat(messages, input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !isVoiceActive && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold serif text-slate-800">Welcome to Lumina Publishing</h3>
            <p className="text-slate-500 max-w-sm mb-4">I am your acquisition assistant. Start a voice consult for a personalized greeting.</p>
            <button
               onClick={startVoiceSession}
               className="bg-amber-500 text-slate-900 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-amber-600 transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Begin Voice Consult</span>
            </button>
          </div>
        )}
        
        {isVoiceActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center shadow-sm animate-pulse">
            <div className="flex justify-center space-x-1 mb-3">
               {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`w-1 bg-amber-500 rounded-full h-8 animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }}></div>
               ))}
            </div>
            <p className="text-amber-800 font-medium serif italic text-lg">"Listening and speaking..."</p>
            <button 
              onClick={stopVoiceSession}
              className="mt-4 text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-4 py-2 rounded-full font-semibold transition-colors"
            >
              End Voice Session
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
            }`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Context" className="w-full h-auto rounded-lg mb-3 border border-slate-100" />
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</div>
              <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 rounded-tl-none flex space-x-2">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative flex items-center space-x-2">
          <button
            type="button"
            onClick={isVoiceActive ? stopVoiceSession : startVoiceSession}
            className={`p-4 rounded-full transition-all ${isVoiceActive ? 'bg-red-500 text-white ring-4 ring-red-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            title={isVoiceActive ? "Stop Voice Mode" : "Start Voice Mode"}
          >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isVoiceActive ? "Listening for your voice..." : "Describe your literary masterpiece..."}
              disabled={isVoiceActive}
              className="w-full bg-slate-50 border border-slate-200 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all pr-16 disabled:opacity-50"
            />
            {!isVoiceActive && (
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-amber-500 text-slate-900 rounded-full hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-3 tracking-wide uppercase font-medium">Lumina Real-time Voice & Editorial Engine</p>
      </div>
    </div>
  );
};

export default ChatWindow;
