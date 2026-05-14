import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import MagneticButton from './MagneticButton';

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-blue transition-colors duration-300 pt-32 pb-16">
      <div className="absolute inset-0 z-0 bg-brand-blue">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 mix-blend-screen bg-[url('/mandala.png')] bg-cover md:bg-[length:auto_140%] bg-center md:bg-[position:100%_center] bg-no-repeat mt-28 md:mt-0"
        ></motion.div>
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-brand-blue via-brand-blue/80 to-brand-blue/40 md:to-transparent"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-4 mb-4 md:mb-10"
          >
            <div className="h-[1px] w-8 md:w-16 bg-brand-gold"></div>
            <p className="text-brand-gold text-[10px] md:text-[11px] uppercase tracking-[0.6em] font-medium font-sans">
              Heritage Collection • <span className="opacity-60">MMXXVI</span>
            </p>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-5xl md:text-[6.5rem] lg:text-[10rem] xl:text-[12rem] font-serif mb-8 md:mb-10 leading-[0.85] tracking-tighter text-brand-beige"
          >
            Eternal <br/>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="italic text-brand-gold"
            >
              Majesty.
            </motion.span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-brand-beige/70 max-w-md md:max-w-xl text-sm md:text-xl font-light italic mb-12 md:mb-16 leading-relaxed border-l-2 border-brand-gold/30 pl-6"
          >
            "Discover the silent poetry of hand-woven silk and the timeless elegance of Indian craftsmanship, curated for the modern connoisseur."
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <MagneticButton 
              onClick={() => router.push('/category/trending')} 
              className="w-full md:w-max px-12 md:px-16 py-6 md:py-7 bg-brand-gold text-brand-blue font-bold text-[10px] md:text-[11px] uppercase tracking-[0.5em] rounded-sm hover:text-brand-gold transition-colors duration-500 shadow-2xl flex items-center justify-center md:justify-start gap-6 group overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center gap-6 group-hover:text-brand-beige transition-colors duration-500">
                Explore Atelier <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-brand-blue -translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            </MagneticButton>

          </motion.div>
        </div>
      </div>
    </section>
  );
}

