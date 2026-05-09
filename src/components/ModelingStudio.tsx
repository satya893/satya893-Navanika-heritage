import React, { useState } from 'react';
import { X, Upload, Sparkles, Box, Play, Check, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

interface ModelingStudioProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id: string;
    name: string;
    image: string;
    category: string;
  };
}

export default function ModelingStudio({ isOpen, onClose, product }: ModelingStudioProps) {
  const [step, setStep] = useState<'upload' | 'generating' | 'result'>('upload');
  const [activeTab, setActiveTab] = useState<'2d' | '3d' | 'video'>('2d');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUserPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!userPhoto) return;
    setStep('generating');
    setIsGenerating(true);
    
    // Simulate multi-phase generation
    setTimeout(() => {
      setStep('result');
      setIsGenerating(false);
    }, 4500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl"
    >
      <div className="bg-[#050505] max-w-6xl w-full h-[85vh] relative flex flex-col md:flex-row shadow-2xl overflow-hidden rounded-3xl border border-white/10">
        <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
          <X size={20} />
        </button>

        {/* Left Side: Visual Viewer */}
        <div className="md:w-3/5 h-1/2 md:h-auto bg-[#0A0A0A] relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div 
                key="upload-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 px-12 text-center"
              >
                <div className="w-24 h-24 bg-brand-gold/10 rounded-full flex items-center justify-center text-brand-gold">
                  <ImageIcon size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif text-white mb-2">Upload Your Profile</h3>
                  <p className="text-white/40 text-sm italic">"A clear, well-lit photo works best for our AI weavers."</p>
                </div>
                <label className="cursor-pointer group">
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                  <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-full flex items-center gap-3 group-hover:bg-white/10 transition-all">
                    <Upload size={18} className="text-brand-gold" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Choose Photo</span>
                  </div>
                </label>
                {userPhoto && (
                  <div className="mt-4 relative animate-in fade-in zoom-in duration-500">
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-brand-gold ring-8 ring-brand-gold/5">
                      <Image src={userPhoto} fill sizes="128px" className="object-cover" alt="User" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'generating' && (
              <motion.div 
                key="gen-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-8 px-12 text-center"
              >
                <div className="relative">
                  <Loader2 size={80} className="animate-spin text-brand-gold opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={32} className="text-brand-gold animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-serif text-white">Weaving Your Showcase...</h3>
                  <div className="flex flex-col gap-2 max-w-xs mx-auto">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-black text-white/40">
                      <span>Phase 1: 2D Try-On</span>
                      <Check size={12} className="text-brand-gold" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-black text-white/40">
                      <span>Phase 2: 3D Mirroring</span>
                      <Loader2 size={12} className="animate-spin text-brand-gold" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-black text-white/20">
                      <span>Phase 3: Video Walk</span>
                      <span>WAITING</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div 
                key="result-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col"
              >
                <div className="flex-1 bg-black flex items-center justify-center">
                  {/* Result Displays based on Active Tab */}
                  {activeTab === '2d' && (
                    <div className="relative w-full h-full">
                      <Image src={userPhoto || ""} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover opacity-80 mix-blend-screen" alt="VTON Result" />
                    </div>
                  )}
                  {activeTab === '3d' && (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                      <Box size={64} className="text-brand-gold animate-bounce" />
                      <p className="text-[10px] uppercase tracking-widest text-brand-gold">3D Mesh Loading...</p>
                    </div>
                  )}
                  {activeTab === 'video' && (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                      <Play size={64} className="text-brand-gold animate-pulse" />
                      <p className="text-[10px] uppercase tracking-widest text-brand-gold">Cinematic Video Playing</p>
                    </div>
                  )}
                </div>

                {/* Tab Switcher */}
                <div className="p-6 bg-white/5 border-t border-white/5 flex gap-4 justify-center">
                  <button 
                    onClick={() => setActiveTab('2d')}
                    className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all ${activeTab === '2d' ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    <ImageIcon size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">2D Try-On</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('3d')}
                    className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all ${activeTab === '3d' ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    <Box size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">3D Mirror</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('video')}
                    className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all ${activeTab === 'video' ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    <Play size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Modeling Video</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Controls */}
        <div className="md:w-2/5 p-8 md:p-14 flex flex-col">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-brand-gold" size={24} />
              <h2 className="text-3xl font-serif text-white tracking-tight">Modeling Studio</h2>
            </div>
            <p className="text-white/40 text-sm leading-relaxed italic">
              "Experience the future of fashion. See yourself in Navanika's heritage drapes before you choose."
            </p>
          </div>

          <div className="space-y-10 flex-1">
            {/* Selected Product Info */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden shadow-2xl">
                <Image src={product?.image || "https://picsum.photos/seed/saree/200/300"} fill sizes="80px" className="object-cover" alt="Product" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-gold mb-1">Selected Garment</h4>
                <p className="text-sm font-serif text-white mb-1">{product?.name || "Kanjeevaram Heritage Saree"}</p>
                <div className="flex gap-2">
                  <span className="text-[8px] bg-white/10 px-2 py-1 rounded-full uppercase font-bold text-white/60">Phase 1: Nano Banana 2</span>
                  <span className="text-[8px] bg-white/10 px-2 py-1 rounded-full uppercase font-bold text-white/60">Phase 3: Veo</span>
                </div>
              </div>
            </div>

            {/* Action Area */}
            {step === 'upload' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-gold">Stylist Instructions</label>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] text-white/60 leading-relaxed font-bold tracking-wider">
                    OUR AI WILL AUTOMATICALLY ANALYZE THE FABRIC TEXTURE (SILK/CREPE) AND DRAPES TO ENSURE AN AUTHENTIC FIT ON YOUR PHOTO.
                  </div>
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={!userPhoto}
                  className="w-full bg-brand-gold text-black font-bold py-5 text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  Initiate Showcase
                </button>
              </div>
            )}

            {step === 'result' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                    <Download size={20} className="text-brand-gold group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-white/60">Download Set</span>
                  </button>
                  <button className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                    <Check size={20} className="text-brand-gold group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-white/60">Share Studio</span>
                  </button>
                </div>
                <button 
                  onClick={() => setStep('upload')}
                  className="w-full border border-brand-gold text-brand-gold font-bold py-5 text-[10px] uppercase tracking-[0.3em] hover:bg-brand-gold hover:text-black transition-all flex items-center justify-center gap-4"
                >
                  New Showcase
                </button>
              </div>
            )}
          </div>

          <div className="mt-auto pt-10 border-t border-white/5 text-center">
            <p className="text-[8px] uppercase tracking-[0.5em] font-black text-white/20">
              Powered by Google Gemini 3 Flash & Veo Engines
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
