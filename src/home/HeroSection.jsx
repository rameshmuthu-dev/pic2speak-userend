import React from 'react';
import heroImage from "../assets/heroImage.png"
import { ArrowRight, Sparkles, Volume2, Image as ImageIcon } from 'lucide-react';

const HeroSection = ({ user, onGetStarted }) => {
  return (
    <section className="grid lg:grid-cols-2 items-center gap-8 lg:gap-12 min-h-screen py-12">
      
      {/* Left Column: Content */}
      <div className="flex flex-col justify-center space-y-6 text-center lg:text-left order-2 lg:order-1">
        <div className="inline-flex items-center self-center lg:self-start gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-bold border border-teal-100">
          <Sparkles size={16} />
          Guided step by step, with care
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-tight">
          Speak <span className="text-teal-500">English</span> <br /> 
          by Seeing <span className="text-emerald-500 italic font-serif">Pictures</span>
        </h1>
        
        <div className="space-y-4 max-w-xl mx-auto lg:mx-0">
          <p className="text-lg text-slate-700 leading-relaxed font-bold">
            Learning simple English sentences by looking at pictures and listening to clear voice guidance.
          </p>
          <p className="text-base text-teal-600 font-bold">
            No grammar pressure, no fear — just calm, step-by-step learning.
          </p>
        </div>

        {!user && (
          <div className="pt-4">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-teal-500 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-teal-600 transition-all shadow-xl shadow-teal-100 active:scale-95 flex items-center justify-center gap-2"
            >
              Start Learning Now <ArrowRight size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Visual with 2 Selected Badges */}
      <div className="relative w-full order-1 lg:order-2 flex items-center justify-center lg:justify-end px-4 md:px-12">
        
        <div className="relative w-full max-w-md">
          {/* Main Hero Image with Rounded Corners */}
          <div className="rounded-3xl overflow-hidden border-8 border-white shadow-2xl">
            <img 
              src={heroImage} 
              alt="English learning"
              className="w-full h-auto block object-cover" 
            />
          </div>
          
          {/* Badge 1: Picture-based (Top Left) */}
          <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-teal-50 ring-4 ring-white">
            <div className="bg-teal-500 p-2 rounded-xl text-white">
              <ImageIcon size={24} />
            </div>
            <span className="font-black text-slate-900 text-sm md:text-base whitespace-nowrap">Picture-based</span>
          </div>

          {/* Badge 2: Listen & Speak (Bottom Left) */}
          <div className="absolute -bottom-6 -right-2 bg-teal-600 p-4 rounded-2xl shadow-xl flex items-center gap-3 border-4 border-white">
            <div className="bg-teal-400 p-2 rounded-xl text-white">
              <Volume2 size={24}/>
            </div>
            <span className="font-bold text-white text-sm md:text-base whitespace-nowrap">Listen & Speak</span>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;