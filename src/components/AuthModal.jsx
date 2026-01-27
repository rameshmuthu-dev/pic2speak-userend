import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';
import GoogleButton from './GoogleButton';

const AuthModal = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      
      {/* max-w-sm or max-w-md provides a clean responsive width */}
      <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-md relative text-center shadow-2xl animate-in fade-in zoom-in duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2"
        >
          <X size={24} />
        </button>

        <div className="mb-8">
          <div className="bg-teal-50 w-16 h-16 rounded-2xl flex items-center justify-center text-teal-500 font-black text-2xl mx-auto mb-4">
            P2S
          </div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Welcome Back!</h2>
          <p className="text-base text-gray-500 mt-2 font-medium">Sign in to continue learning</p>
        </div>

        <div className="flex justify-center py-4">
          <div className="w-full max-w-xs">
             <GoogleButton />
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-8 uppercase tracking-widest font-bold">
          More login options coming soon!
        </p>
      </div>
    </div>
  );
};

export default AuthModal;