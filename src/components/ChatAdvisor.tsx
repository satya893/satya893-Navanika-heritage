import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { startChat } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

interface ChatAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatAdvisor({ isOpen, onClose }: ChatAdvisorProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = startChat("You are a luxury fashion consultant for Navanika Boutique. We specialize in heritage sarees, formal wear, and contemporary ethnic fashion. Provide personalized, elegant, and poetic style advice. Use Google Search to find current trends if needed.");
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'model', text: "I apologize, but my creative spirit is momentarily resting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 right-8 w-96 h-[600px] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
    >
      <div className="p-6 bg-[#C5A059] text-black flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Sparkles size={20} />
          <h3 className="font-serif text-lg">Style Concierge</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <Sparkles size={48} className="text-[#C5A059] opacity-20" />
            <p className="text-white/40 font-serif italic">"Allow me to curate the perfect look for your next presence."</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-white/80'
            }`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-4 rounded-2xl">
              <Loader2 size={16} className="animate-spin text-[#C5A059]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/10 flex gap-3">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask for style advice..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-sm focus:border-[#C5A059] outline-none transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="w-12 h-12 bg-[#C5A059] text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}
