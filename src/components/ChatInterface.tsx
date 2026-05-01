import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Send, User, Sparkles, Terminal, Search, Zap, Cpu, Brain, 
  Loader2, Globe, Paperclip, Coins, Image as ImageIcon, X
} from 'lucide-react';
import { Message, Theme, AppSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, files?: { name: string, content: string }[], images?: string[]) => void;
  userName: string;
  theme: Theme;
  settings: AppSettings;
  credits: number;
  lastTokenReset: number;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export default function ChatInterface({ messages, isLoading, onSendMessage, userName, theme, settings, credits, lastTokenReset, onUpdateSettings }: ChatInterfaceProps) {
  const [input, setInput] = React.useState('');
  const [selectedFiles, setSelectedFiles] = React.useState<{ name: string, content: string }[]>([]);
  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [animatedMessageId, setAnimatedMessageId] = React.useState<string | null>(null);
  const [animatedText, setAnimatedText] = React.useState('');

  const isExhausted = credits <= 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant || isLoading) return;

    setAnimatedMessageId(lastAssistant.id);
    setAnimatedText('');
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setAnimatedText(lastAssistant.content.slice(0, index));
      if (index >= lastAssistant.content.length) clearInterval(timer);
    }, 1);

    return () => clearInterval(timer);
  }, [messages, isLoading]);

  const getTimeToReset = () => {
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const nextReset = (lastTokenReset || Date.now()) + THREE_HOURS;
    const diff = nextReset - Date.now();
    if (diff <= 0) return 'Resetting...';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: { name: string, content: string }[] = [];
    const JSZip = (await import('jszip')).default;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(file);
          const zipFiles = Object.keys(zip.files);
          for (const filename of zipFiles) {
            const zipFile = zip.files[filename];
            if (!zipFile.dir) {
              const content = await zipFile.async('text');
              newFiles.push({ name: `${file.name}/${filename}`, content });
            }
          }
        } catch (err) {
          console.error("Zip Error:", err);
        }
      } else {
        const content = await file.text();
        newFiles.push({ name: file.name, content });
      }
    }
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExhausted) return;
    if ((input.trim() || selectedFiles.length > 0 || selectedImages.length > 0) && !isLoading) {
      onSendMessage(input.trim(), selectedFiles, selectedImages);
      setInput('');
      setSelectedFiles([]);
      setSelectedImages([]);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex-1 flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
      {/* Top Navigation */}
      <div className={`h-14 border-b flex items-center justify-between px-6 shrink-0 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-[#E5E5E1]'}`}>
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-[#D97757]" />
          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Project Studio</span>
        </div>
          <div className={`flex items-center gap-4`}>
            <div className={`flex flex-col items-end`}>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isDark ? 'bg-[#0a0a0a] border-[#2a2a2a]' : 'bg-[#f9f9f8] border-[#E5E5E1]'}`}>
                <Coins size={14} className={isExhausted ? 'text-red-500' : 'text-[#D97757]'} />
                <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-400' : 'text-[#4a4a4a]'}`}>
                  {credits}/12 TOKENS {isExhausted && '(EXHAUSTED)'}
                </span>
              </div>
              <p className={`text-[8px] font-bold uppercase tracking-tighter mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Refill In: {getTimeToReset()}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isDark ? 'bg-[#0a0a0a] border-[#2a2a2a]' : 'bg-[#f9f9f8] border-[#E5E5E1]'}`}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-400' : 'text-[#4a4a4a]'}`}>System Online</span>
            </div>
          </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-12 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#2a2a2a]' : 'bg-[#e5e5e1]'}`}>
              <Sparkles size={32} className={isDark ? 'text-white' : 'text-[#1a1a1a]'} />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Name-Code Engine</h3>
            <p className={`text-sm max-w-sm mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-[#1a1a1a]'}`}>Universal coding assistant. Specialized in Minecraft Java/Bedrock and Modern Full-stack.</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-6 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-sm ${
                msg.role === 'user' ? (isDark ? 'bg-[#D97757]' : 'bg-[#1a1a1a]') : 'bg-[#D97757]'
              } text-white`}>
                {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
              </div>
              
              <div className={`flex-1 space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`text-[11px] font-bold uppercase tracking-widest px-1 ${isDark ? 'text-[#555]' : 'text-[#8e8e8e]'}`}>
                  {msg.role === 'user' ? userName : 'AI Studio'}
                </div>
                {msg.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                    className="text-[10px] px-2 py-1 rounded-md bg-[#D97757] text-white font-bold"
                  >
                    COPY
                  </button>
                )}
                
                {msg.isReading && (
                  <div className={`flex items-center gap-2 text-xs font-bold text-[#D97757] mb-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <Globe size={14} className="animate-spin" />
                    READING CONTENT...
                  </div>
                )}

                <div className={`prose prose-sm max-w-none leading-relaxed ${isDark ? 'prose-invert text-gray-300' : 'text-[#1a1a1a]'} ${
                  msg.role === 'user' ? (isDark ? 'bg-[#2a2a2a] text-white p-4 rounded-2xl inline-block' : 'bg-[#f9f9f8] p-4 rounded-2xl inline-block') : ''
                }`}>
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="my-4 rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                            <div className="bg-[#1a1a1a] px-4 py-2 flex justify-between items-center border-b border-white/5">
                              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="!m-0 !bg-[#1E1E1E]"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={`px-1.5 py-0.5 rounded font-bold ${isDark ? 'bg-[#333] text-[#D97757]' : 'bg-[#f0f0ee] text-[#D97757]'}`} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {animatedMessageId === msg.id ? animatedText : msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-6 max-w-4xl mx-auto">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#D97757]/20 flex items-center justify-center">
              <Loader2 size={20} className="text-[#D97757] animate-spin" />
            </div>
            <div className="flex-1 space-y-2 py-2">
              <p className="text-xs font-bold text-[#D97757] animate-pulse">AI sedang menganalisis & berpikir...</p>
              <div className={`h-4 rounded-full w-2/3 animate-pulse ${isDark ? 'bg-[#2a2a2a]' : 'bg-[#f9f9f8]'}`} />
              <div className={`h-4 rounded-full w-1/2 animate-pulse ${isDark ? 'bg-[#2a2a2a]' : 'bg-[#f9f9f8]'}`} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-6 shrink-0 border-t transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-[#E5E5E1]'}`}>
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Feature Toggles */}
          <div className="flex flex-wrap gap-2">
            <ToggleButton 
              active={settings.searchEnabled} 
              onClick={() => onUpdateSettings({ searchEnabled: !settings.searchEnabled })}
              icon={<Search size={14} />} 
              label="Search" 
              theme={theme}
            />
            <ToggleButton 
              active={settings.deepSeekEnabled} 
              onClick={() => onUpdateSettings({ deepSeekEnabled: !settings.deepSeekEnabled })}
              icon={<Zap size={14} />} 
              label="DeepSeek" 
              theme={theme}
            />
            <ToggleButton 
              active={settings.intelligentEnabled} 
              onClick={() => onUpdateSettings({ intelligentEnabled: !settings.intelligentEnabled })}
              icon={<Cpu size={14} />} 
              label="Intelligent" 
              theme={theme}
            />
            <ToggleButton 
              active={settings.thinkBeforeAct} 
              onClick={() => onUpdateSettings({ thinkBeforeAct: !settings.thinkBeforeAct })}
              icon={<Brain size={14} />} 
              label="Think Step" 
              theme={theme}
            />
          </div>

          <form 
            onSubmit={handleSubmit}
            className="relative group"
          >
            {(selectedFiles.length > 0 || selectedImages.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-black/5 dark:bg-white/5">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 bg-[#D97757] text-white text-[10px] font-bold rounded-lg uppercase">
                    <Paperclip size={10} />
                    {f.name}
                    <button 
                      type="button"
                      onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="hover:text-black transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {selectedImages.map((img, i) => (
                  <div key={`img-${i}`} className="relative group/img">
                    <img src={img} alt="preview" className="w-12 h-12 rounded-lg object-cover border-2 border-[#D97757]" />
                    <button 
                      type="button"
                      onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative">
              <textarea 
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isExhausted) handleSubmit(e);
                  }
                }}
                disabled={isExhausted}
                placeholder={isExhausted ? "Tokens exhausted. Please wait for refill." : "Send a message or upload files for analysis..."}
                className={`w-full border outline-none rounded-2xl px-6 py-4 pr-32 transition-all placeholder:text-[#666] resize-none shadow-sm min-h-[56px] max-h-40 ${
                  isExhausted ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isDark ? 'bg-[#111] border-[#2a2a2a] text-white focus:border-[#D97757]' : 'bg-[#fcfcfb] border-[#E5E5E1] text-[#1a1a1a] focus:border-[#D97757]'
                }`}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <input 
                  type="file" 
                  accept="image/*"
                  multiple 
                  ref={imageInputRef} 
                  onChange={handleImageChange} 
                  disabled={isExhausted}
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isExhausted}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                    isDark ? 'bg-[#2a2a2a] text-gray-400 hover:text-white' : 'bg-[#efefed] text-[#4a4a4a] hover:bg-[#e5e5e1]'
                  } ${isExhausted ? 'opacity-30' : ''}`}
                >
                  <ImageIcon size={18} />
                </button>
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  disabled={isExhausted}
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExhausted}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                    isDark ? 'bg-[#2a2a2a] text-gray-400 hover:text-white' : 'bg-[#efefed] text-[#4a4a4a] hover:bg-[#e5e5e1]'
                  } ${isExhausted ? 'opacity-30' : ''}`}
                >
                  <Paperclip size={18} />
                </button>
                <button 
                  type="submit"
                  disabled={(!input.trim() && selectedFiles.length === 0 && selectedImages.length === 0) || isLoading || isExhausted}
                  className="w-10 h-10 bg-[#D97757] text-white flex items-center justify-center rounded-xl hover:bg-[#c6684b] transition-all disabled:opacity-30 shadow-lg"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </form>
          <p className={`text-center text-[9px] font-bold uppercase tracking-[0.2em] mt-2 ${isDark ? 'text-gray-600' : 'text-[#8e8e8e]'}`}>
            Name-Code v4.2 PRO • AI Studio Mode
          </p>
        </div>
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, icon, label, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, theme: Theme }) {
  const isDark = theme === 'dark';
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
        active 
          ? 'bg-[#D97757] text-white border-[#D97757] shadow-sm scale-[1.02]' 
          : (isDark ? 'bg-[#2a2a2a] border-[#333] text-gray-400 hover:text-white' : 'bg-[#f0f0ee] border-[#E5E5E1] text-[#8e8e8e] hover:text-[#1a1a1a]')
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
