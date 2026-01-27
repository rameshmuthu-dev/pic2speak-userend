import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center space-y-6">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-[#14B8A6] w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm">
              P2S
            </div>
            <span className="text-xl font-bold text-slate-900">
              Pic2<span className="text-[#14B8A6]">Speak</span>
            </span>
          </Link>

          {/* Social Icons */}
          <div className="flex gap-6 text-slate-400">
            <a href="#" className="hover:text-[#14B8A6] transition-all"><Instagram size={22} /></a>
            <a href="#" className="hover:text-[#14B8A6] transition-all"><Youtube size={22} /></a>
            <a href="mailto:support@pic2speak.com" className="hover:text-[#14B8A6] transition-all"><Mail size={22} /></a>
          </div>

          {/* Copyright - Only essential info */}
          <div className="pt-6 border-t border-slate-50 w-full text-xs font-bold text-slate-400 uppercase tracking-widest">
            <p>© {currentYear} Pic2Speak — Learn English Naturally</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;