import React, { useState } from 'react';
import { X, Sparkles, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { generateProductImage } from '../lib/gemini';

interface ImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageGenerator({ isOpen, onClose }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<"512px" | "1K" | "2K" | "4K">("1K");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateProductImage(prompt, size);
      if (result) {
        setImage(result);
      } else {
        setError("No image data returned from AI weaver.");
      }
    } catch (err: any) {
      console.error("Image gen error", err);
      let msg = "The AI weaver is temporarily unavailable.";
      if (err.message?.includes("quota") || err.message?.includes("429")) {
        msg = "Atelier quota exceeded. Please try again later or check your API key.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
    >
      <div className="bg-[#0A0A0A] max-w-4xl w-full relative flex flex-col md:flex-row shadow-2xl overflow-hidden rounded-2xl border border-white/10">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 text-white/40 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="md:w-1/2 h-96 md:h-auto bg-white/5 flex items-center justify-center relative group">
          {image ? (
            <>
              <div className="relative w-full h-full">
                <Image src={image} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" alt="Generated" />
              </div>
              <a 
                href={image} 
                download="navanika-design.png"
                className="absolute bottom-6 right-6 w-12 h-12 bg-black/50 backdrop-blur-md text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download size={20} />
              </a>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/20">
              {loading ? <Loader2 size={48} className="animate-spin text-[#C5A059]" /> : <ImageIcon size={48} />}
              <p className="text-sm font-serif italic">"Your vision, woven by AI."</p>
            </div>
          )}
        </div>

        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-[#C5A059]" size={24} />
            <h2 className="text-3xl font-serif">Virtual Atelier</h2>
          </div>
          
          <p className="text-white/40 text-sm mb-8 leading-relaxed italic">
            "Describe your dream ensemble, and our master AI weaver will bring it to life."
          </p>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.4em] font-black text-[#C5A059]">Design Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A royal blue silk saree with golden peacock motifs and a velvet border..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-[#C5A059] outline-none transition-all min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.4em] font-black text-[#C5A059]">Resolution</label>
              <div className="flex gap-3">
                {(["512px", "1K", "2K", "4K"] as const).map(s => (
                  <button 
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-bold border transition-all ${
                      size === s ? 'bg-[#C5A059] text-black border-[#C5A059]' : 'border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs italic">
                {error}
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-[#C5A059] text-black font-bold py-5 text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Weave Design
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
