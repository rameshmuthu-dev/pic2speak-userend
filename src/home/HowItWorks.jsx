import React from 'react';
// Importing the reusable Card component from the ui folder
import Card from '../ui/Card'; 
import { Eye, Headphones, Mic, Sparkles } from 'lucide-react';

const HowItWorks = () => {
  // Array containing the steps for learning
  const steps = [
    {
      icon: <Eye size={32} />,
      title: "1. See",
      desc: "Observe high-quality 3D illustrations to understand concepts without translation.",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      icon: <Headphones size={32} />,
      title: "2. Listen",
      desc: "Hear the perfect native pronunciation to train your ears and improve accent.",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      icon: <Mic size={32} />,
      title: "3. Speak",
      desc: "Record your voice and practice speaking until you feel confident and natural.",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600"
    }
  ];

  return (
    /* scroll-mt-24 ensures the section title is not hidden behind the sticky navbar */
    <section id="how-it-works" className="py-20 bg-white scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header: Centered and styled for a clean look */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-bold border border-orange-100 mb-4">
            <Sparkles size={16} />
            Our Learning Path
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
            How it <span className="text-teal-500">Works?</span>
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">
            Master English in three simple steps. We focus on natural acquisition 
            rather than boring grammar rules.
          </p>
        </div>

        {/* Steps Grid: Displaying the 3 steps using the Card component */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index}
              icon={step.icon}
              title={step.title}
              desc={step.desc}
              iconBg={step.iconBg}
              iconColor={step.iconColor}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;