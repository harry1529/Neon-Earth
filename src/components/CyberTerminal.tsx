import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Send,
  X,
  Sparkles,
  Search,
  ExternalLink,
  Bot,
  User,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { audioSystem } from '../services/audioSystem';

interface Message {
  id: string;
  sender: 'user' | 'aura';
  text: string;
  time: string;
  grounding?: Array<{ web?: { uri?: string; title?: string } }>;
  imageUrl?: string;
}

interface CyberTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const CyberTerminal: React.FC<CyberTerminalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'aura',
      text: 'A.U.R.A. v4.9 ONLINE // Tactical Neural Uplink active in Sector-07. Ask me anything about NEON EARTH districts, quantum grid telemetry, or query real-world planetary databases via Google Search Grounding.',
      time: '04:09:21',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputVal;
    if (!textToSend.trim() || isLoading) return;

    audioSystem.playPing(880, 0.15);

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-6).map((m) => ({
            sender: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          query: textToSend,
        }),
      });

      const data = await res.json();
      audioSystem.playPing(1150, 0.2);

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'aura',
            text: `[UPLINK ANOMALY] ${data.error}: ${data.details || 'Check neural matrix connection'}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `aura-${Date.now()}`,
            sender: 'aura',
            text: data.reply,
            grounding: data.grounding,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'aura',
          text: '[CONNECTION LOST] Sub-ether relay unreachable. Ensure local gateway is running.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!inputVal.trim() || isGeneratingImage) return;
    const prompt = inputVal;
    audioSystem.playWarp();
    setIsGeneratingImage(true);
    onShowToast('SYNTHESIZING CYBERPUNK NEURAL VISION...');

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: `[GENERATE VISION] ${prompt}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (data.imageUrl) {
        audioSystem.playSubroutine();
        setMessages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}`,
            sender: 'aura',
            text: `VISION FEED RENDERED FOR: "${prompt}"`,
            imageUrl: data.imageUrl,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        onShowToast('NEURAL VISION FEED RECEIVED');
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch {
      onShowToast('VISION GENERATION TIMED OUT');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const samplePrompts = [
    'Analyze Central Spire quantum efficiency',
    'Decode Underground Market contraband frequencies',
    'Orbital Gate launch trajectory to Mars colonies',
    'Latest real-world breakthroughs in quantum computing',
  ];

  return (
    <div className="absolute inset-y-0 right-0 z-40 w-full sm:w-[450px] md:w-[480px] bg-[#030712]/92 backdrop-blur-md border-l border-[#00f0ff]/40 flex flex-col justify-between shadow-2xl transition-all duration-300">
      {/* Terminal Header */}
      <div className="p-4 border-b border-[#00f0ff]/20 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center text-[#00f0ff]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-xs tracking-wider text-white flex items-center gap-2">
              A.U.R.A. CO-PILOT
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00f0ff]/20 text-[#00f0ff] font-mono">
                GEMINI-3.8
              </span>
            </div>
            <div className="font-mono text-[9px] text-slate-400">
              SEARCH GROUNDING // NEURAL UPLINK ONLINE
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono no-scrollbar">
        <span className="text-[#00f0ff] flex-shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> INTEL:
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-[#00f0ff]/20 hover:text-[#00f0ff] text-slate-300 transition whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-1">
              {m.sender === 'user' ? (
                <>
                  <span>YOU</span>
                  <User className="w-3 h-3 text-[#ff007f]" />
                  <span>{m.time}</span>
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-[#00f0ff]" />
                  <span className="text-[#00f0ff] font-bold">A.U.R.A.</span>
                  <span>{m.time}</span>
                </>
              )}
            </div>

            <div
              className={`p-3 rounded-lg max-w-[92%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#ff007f]/15 border border-[#ff007f]/40 text-slate-100'
                  : 'bg-slate-900/90 border border-[#00f0ff]/30 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap font-rajdhani text-sm sm:text-base leading-normal">
                {m.text}
              </div>

              {/* Generated Image Preview if available */}
              {m.imageUrl && (
                <div className="mt-3 rounded overflow-hidden border border-[#00f0ff]/50 box-glow-cyan">
                  <img
                    src={m.imageUrl}
                    alt="Neural Vision"
                    className="w-full h-auto object-cover max-h-60"
                  />
                </div>
              )}

              {/* Grounding Citations */}
              {m.grounding && m.grounding.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[9px]">
                  <div className="flex items-center gap-1 text-slate-400 mb-1 font-semibold">
                    <Search className="w-3 h-3 text-[#00f0ff]" />
                    <span>GOOGLE SEARCH GROUNDED SOURCES:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.grounding.map((g, gi) =>
                      g.web?.uri ? (
                        <a
                          key={gi}
                          href={g.web.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[#00f0ff] hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          <span className="truncate">{g.web.title || g.web.uri}</span>
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                        </a>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
            <Loader2 className="w-4 h-4 text-[#00f0ff] animate-spin" />
            <span>SYNTHESIZING QUANTUM INTELLIGENCE...</span>
          </div>
        )}

        {isGeneratingImage && (
          <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
            <Loader2 className="w-4 h-4 text-[#ff007f] animate-spin" />
            <span>PROJECTION IN PROGRESS // RENDERING PIXELS...</span>
          </div>
        )}
      </div>

      {/* Input Box & Generation Buttons */}
      <div className="p-3.5 border-t border-[#00f0ff]/20 bg-slate-950/90">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Query tactical co-pilot or enter prompt..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-[#00f0ff] px-3.5 py-2.5 rounded text-xs text-white placeholder-slate-500 font-mono outline-none"
          />

          <button
            onClick={() => handleSend()}
            disabled={isLoading || isGeneratingImage || !inputVal.trim()}
            title="Send Query (Google Search Grounded)"
            className="p-2.5 rounded bg-[#00f0ff] text-[#030712] hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>

          <button
            onClick={handleGenerateImage}
            disabled={isLoading || isGeneratingImage || !inputVal.trim()}
            title="Generate Cyberpunk Image from Prompt"
            className="p-2.5 rounded bg-[#ff007f] text-white hover:bg-white hover:text-[#030712] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-2 px-1">
          <span>ENTER: TRANSMIT</span>
          <span className="text-[#ff007f]">IMAGE BTN: RENDER PROMPT</span>
        </div>
      </div>
    </div>
  );
};
