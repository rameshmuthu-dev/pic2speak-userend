import React from 'react';
import aboutImage from "../assets/aboutImage.png";
import { Heart, Sparkles } from 'lucide-react';

const About = () => {
  return (
    /* 1. Added id="about" for navigation */
    <section id="about" className="py-20 bg-slate-50 rounded-[3rem] my-10 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* 2. Added Section Title for clarity */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
            About <span className="text-teal-500">Pic2Speak</span>
          </h2>
          <div className="w-24 h-1.5 bg-teal-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image Column */}
          <div className="order-2 lg:order-1 relative">
            <div className="rounded-3xl overflow-hidden border-8 border-white shadow-2xl">
              <img 
                src={aboutImage} 
                alt="About Pic2Speak" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-teal-50 flex items-center gap-3">
               <div className="bg-rose-500 p-2 rounded-xl text-white">
                  <Heart size={20} fill="currentColor"/>
               </div>
               <span className="font-bold text-slate-800 text-sm">Made for You</span>
            </div>
          </div>

          {/* Right: Content Column */}
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-bold border border-teal-100">
              <Sparkles size={16} />
              Our Vision
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              Designed for <span className="text-teal-500">Natural</span> Learning Experience
            </h2>
            
            <div className="space-y-4 text-slate-600 font-medium leading-relaxed">
              <p>
                Pic2Speak was born from a simple idea: English learning shouldn't be scary. We believe that everyone can speak English by simply observing and listening.
              </p>
              <p>
                By removing the stress of grammar and focusing on visual memory, we help you build confidence step by step, just like how we learned our mother tongue at home.
              </p>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-6">
              <div className="border-l-4 border-teal-500 pl-4">
                <h4 className="font-black text-2xl text-slate-900">100%</h4>
                <p className="text-sm text-slate-500 font-bold uppercase">Visual Based</p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4">
                <h4 className="font-black text-2xl text-slate-900">Zero</h4>
                <p className="text-sm text-slate-500 font-bold uppercase">Grammar Stress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;