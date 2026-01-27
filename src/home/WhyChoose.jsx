import React from 'react';
import { Volume2, ShieldCheck, Heart } from 'lucide-react';
import Card from '../ui/Card'; // src/ui/Card.jsx-ல் இருந்து இம்போர்ட் செய்யப்படுகிறது

const WhyChoose = () => {
  // Features data array
  const features = [
    {
      icon: <Volume2 size={32} />,
      title: "Clear Voice Guidance",
      desc: "Every picture comes with a clear voice recording. Even if you can't read yet, you can listen and learn.",
      iconColor: "text-teal-600",
      iconBg: "bg-teal-50"
    },
    {
      icon: <ShieldCheck size={32} />,
      title: "No Grammar Pressure",
      desc: "No need to memorize complex rules. Start speaking English naturally, just like your mother tongue.",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50"
    },
    {
      icon: <Heart size={32} />,
      title: "Home-like Learning",
      desc: "A kind and gentle environment for learning. Progress at your own pace without any fear.",
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Heading with Teal Highlight */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
            Why start with <span className="text-teal-500">Pic2Speak?</span>
          </h2>
          <div className="w-24 h-1.5 bg-teal-500 mx-auto rounded-full"></div>
        </div>

        {/* Grid Layout using the Reusable Card Component */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((item, index) => (
            <Card 
              key={index} 
              {...item} // Passing all properties (icon, title, desc, etc.) to the Card component
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyChoose;