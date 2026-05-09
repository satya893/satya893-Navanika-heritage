import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-blue transition-colors duration-300 pt-32 pb-16">
      <div className="absolute inset-0 z-0 bg-brand-blue">
        <div 
          className="absolute inset-0 opacity-40 md:opacity-60 mix-blend-screen bg-[url('/mandala.png')] bg-cover md:bg-[length:auto_140%] bg-center md:bg-[position:100%_center] bg-no-repeat mt-28 md:mt-0"
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-brand-blue via-brand-blue/80 to-brand-blue/40 md:to-transparent"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-4 md:mb-8">
            <div className="h-[1px] w-8 md:w-16 bg-[#C5A059]"></div>
            <p className="text-[#C5A059] text-[8px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.6em] font-black">Heritage Collection • MMXXVI</p>
          </div>
          <h1 className="text-6xl md:text-[7.5rem] lg:text-[9rem] xl:text-[11rem] font-serif mb-6 md:mb-8 leading-[0.85] tracking-tighter text-brand-beige">
            Eternal <br/>
            <span className="italic text-[#C5A059]">Majesty.</span>
          </h1>
          <p className="text-brand-beige/80 max-w-md md:max-w-xl text-sm md:text-xl font-light italic mb-10 md:mb-14 leading-relaxed">
            "Discover the silent poetry of hand-woven silk and the timeless elegance of Indian craftsmanship, curated for the modern connoisseur."
          </p>
          <button 
            onClick={() => router.push('/category/trending')} 
            className="w-full md:w-max px-12 md:px-16 py-5 md:py-6 bg-[#C5A059] text-brand-blue font-bold text-[10px] md:text-[11px] uppercase tracking-[0.5em] rounded-sm hover:bg-brand-beige transition-all duration-500 shadow-2xl flex items-center justify-center md:justify-start gap-6 group"
          >
            Explore Atelier <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
