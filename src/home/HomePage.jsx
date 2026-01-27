import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import AuthModal from '../components/AuthModal';
import HeroSection from './HeroSection'; // Same folder import
import WhyChoose from './WhyChoose';
import About from './About';
import HowItWorks from './HowItWorks';

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 pb-20">
      
      {/* 1. Hero Section Component */}
      <HeroSection 
        user={user} 
        onGetStarted={() => setIsModalOpen(true)} 
      />

      {/* 2. Why Choose Pic2Speak Section */}
      <WhyChoose />
      {/* 3. The process of learning (1-2-3 steps) */}
      <HowItWorks />
      <About />
      {/* 2. Future Components will be added here (e.g., WhyChoose, Lessons) */}
      {/* {user && <FeaturedLessons />} */}

      {/* Login/Signup Modal */}
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default HomePage;