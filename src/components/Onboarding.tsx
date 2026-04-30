import React, { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F9F9F8] z-50 flex items-center justify-center p-6 bg-gradient-to-br from-[#F9F9F8] to-[#E5E5E1]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-[#E5E5E1] rounded-[2rem] p-10 shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#D97757] rounded-3xl flex items-center justify-center text-white shadow-xl ring-8 ring-[#D97757]/10">
            <User size={40} />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-[#1a1a1a] text-center mb-2 tracking-tight">Name-Code</h2>
        <p className="text-[#8e8e8e] text-center mb-10 text-sm font-medium uppercase tracking-widest">Professional AI Workspace</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#8e8e8e] uppercase tracking-[0.2em] ml-1 cursor-default text-center">Identity Signature</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="YOUR NAME..."
              className="w-full bg-[#fcfcfb] border border-[#E5E5E1] focus:border-[#D97757] outline-none rounded-2xl px-6 py-5 text-[#1a1a1a] transition-all placeholder:text-[#c4c4c4] text-center font-bold text-lg shadow-inner"
              autoFocus
            />
          </div>
          
          <button 
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-[#1a1a1a] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg active:scale-[0.98]"
          >
            Initialize
            <ArrowRight size={20} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <div className="mt-12 flex justify-center gap-6 border-t border-[#E5E5E1] pt-8">
          <div className="text-center">
            <p className="text-xs font-black text-[#D97757]">AI-MC</p>
            <p className="text-[9px] text-[#8e8e8e] font-bold uppercase tracking-tighter">Minecraft</p>
          </div>
          <div className="w-px h-8 bg-[#E5E5E1]"></div>
          <div className="text-center">
            <p className="text-xs font-black text-[#D97757]">AI-FIX</p>
            <p className="text-[9px] text-[#8e8e8e] font-bold uppercase tracking-tighter">Debugger</p>
          </div>
          <div className="w-px h-8 bg-[#E5E5E1]"></div>
          <div className="text-center">
            <p className="text-xs font-black text-[#D97757]">PRO</p>
            <p className="text-[9px] text-[#8e8e8e] font-bold uppercase tracking-tighter">High Speed</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
