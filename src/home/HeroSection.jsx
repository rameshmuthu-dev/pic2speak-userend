import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import heroImage from "../assets/heroImage.png";
import { ArrowRight, Sparkles, Volume2, Image as ImageIcon } from 'lucide-react';
import Button from '../ui/Button';

const HeroSection = ({ onGetStarted }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { user: profileData } = useSelector((state) => state.user);

  const handleAction = () => {
    if (isAuthenticated) {
      navigate('/lessons');
    } else {
      onGetStarted();
    }
  };

  return (
    <section className="grid lg:grid-cols-2 items-center gap-6 lg:gap-12 py-6 lg:py-12">
      <div className="flex flex-col justify-center space-y-4 text-center lg:text-left order-2 lg:order-1">
        {isAuthenticated ? (
          <div className="hidden lg:inline-flex items-center self-center lg:self-start gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-bold border border-teal-100">
            <Sparkles size={16} />
            Keep up the streak, {profileData?.name || "Learner"}!
          </div>
        ) : (
          <div className="hidden lg:inline-flex items-center self-center lg:self-start gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-bold border border-teal-100">
            <Sparkles size={16} />
            Guided step by step, with care
          </div>
        )}

        <h1 className="text-3xl lg:text-7xl font-black text-slate-900 leading-tight">
          {isAuthenticated ? (
            <>
              Welcome Back, <br />
              <span className="text-teal-500">{profileData?.name || "Friend"}!</span>
            </>
          ) : (
            <>
              Speak <span className="text-teal-500">English</span> <br />
              by Seeing <span className="text-emerald-500 italic font-serif">Pictures</span>
            </>
          )}
        </h1>

        <div className="pt-2 flex justify-center lg:justify-start">
          <Button
            onClick={handleAction}
            variant="primary"
            className="w-full lg:w-auto flex items-center justify-center gap-2 px-10"
          >
            {isAuthenticated ? 'Continue Lessons' : 'Start Learning Now'}
            <ArrowRight size={22} />
          </Button>
        </div>

        <div className="space-y-4 max-w-xl mx-auto lg:mx-0">
          <p className="text-lg text-slate-700 leading-relaxed font-bold">
            {isAuthenticated
              ? "Your learning journey is waiting. Let's pick up where you left off."
              : "Learning simple English sentences by looking at pictures and listening to clear voice guidance."
            }
          </p>
          {!isAuthenticated && (
            <p className="text-base text-teal-600 font-bold">
              No grammar pressure, no fear — just calm, step-by-step learning.
            </p>
          )}
        </div>
      </div>

      <div className="relative w-full order-1 lg:order-2 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[300px] lg:max-w-md">
          <div className="rounded-3xl overflow-hidden border-8 border-white shadow-2xl">
            <img
              src={heroImage}
              alt="English learning"
              className="w-full h-auto block object-cover"
            />
          </div>

          <div className="absolute -top-4 -left-4 bg-white p-2 lg:p-3 rounded-2xl shadow-lg flex items-center gap-1.5 lg:gap-3 border-2 border-teal-500">
            <div className="bg-teal-500 p-1 rounded-xl text-white">
              <ImageIcon size={14} />
            </div>
            <span className="font-black text-slate-900 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Picture-based</span>
          </div>

          <div className="absolute -bottom-4 -right-2 bg-teal-600 p-2 lg:p-3 rounded-2xl shadow-lg flex items-center gap-1.5 lg:gap-3 border-2 border-teal-400">
            <div className="bg-teal-400 p-1 rounded-xl text-white">
              <Volume2 size={14} />
            </div>
            <span className="font-bold text-white text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Listen & Speak</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;