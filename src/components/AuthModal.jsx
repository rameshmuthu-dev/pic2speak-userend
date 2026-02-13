import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';
import GoogleButton from './GoogleButton';
import { toast } from 'react-toastify';

const AuthModal = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  
  // Local state to track if we are in the middle of a login redirect
  const [isProcessing, setIsProcessing] = useState(
    sessionStorage.getItem('auth_processing') === 'true'
  );

  useEffect(() => {
    // FIX: If modal is opened manually, reset the processing flag
    // This ensures the modal is NOT blocked if a previous attempt failed
    if (isOpen && !user) {
      sessionStorage.removeItem('auth_processing');
      setIsProcessing(false);
    }

    // If user successfully logs in, cleanup and close
    if (user) {
      sessionStorage.removeItem('auth_processing');
      setIsProcessing(false);
      onClose();
    }
  }, [user, isOpen, onClose]);

  const handleLoginStart = () => {
    // Set flag before redirect to prevent "flash/ghosting" on page reload
    sessionStorage.setItem('auth_processing', 'true');
    setIsProcessing(true);
    toast.info("Connecting to Google...", { autoClose: 1000 });
  };

  const handleManualClose = () => {
    sessionStorage.removeItem('auth_processing');
    setIsProcessing(false);
    onClose();
  };

  // The modal will only be hidden if:
  // 1. It's not supposed to be open (isOpen is false)
  // 2. User is already logged in
  // 3. We are currently processing a redirect (isProcessing is true)
  if (!isOpen || user || isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      
      <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-md relative text-center shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={handleManualClose}
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
          <div className="w-full max-w-xs" onClick={handleLoginStart}>
             <GoogleButton onAuthSuccess={onClose} />
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-8 uppercase tracking-widest font-bold">
          Secure Login with Google
        </p>
      </div>
    </div>
  );
};

export default AuthModal;