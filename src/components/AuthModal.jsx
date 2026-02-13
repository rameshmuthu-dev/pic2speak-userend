import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';
import GoogleButton from './GoogleButton';
import { toast } from 'react-toastify';

const AuthModal = ({ isOpen, onClose }) => {
  const { user, loading } = useSelector((state) => state.auth);
  
  // Local state to hide modal instantly even before backend responds
  const [isOptimisticClosed, setIsOptimisticClosed] = useState(false);

  // Persistence check: If page reloads during Google redirect
  const [isProcessing, setIsProcessing] = useState(
    sessionStorage.getItem('auth_processing') === 'true'
  );

  useEffect(() => {
    // When backend finally confirms user, cleanup everything
    if (user) {
      sessionStorage.removeItem('auth_processing');
      setIsProcessing(false);
      setIsOptimisticClosed(false); 
      onClose(); // Ensure parent state is updated
    }
  }, [user, onClose]);

  const handleLoginStart = () => {
    // 1. Mark in session that we are authenticating
    sessionStorage.setItem('auth_processing', 'true');
    
    // 2. Optimistic UI: Hide the modal IMMEDIATELY 
    // This removes the 1-2 second "waiting" feel
    setIsOptimisticClosed(true);
    
    // 3. Optional: Small toast to show progress in background
    toast.info("Verifying your account...", { autoClose: 1500, icon: "🔐" });
  };

  const handleManualClose = () => {
    sessionStorage.removeItem('auth_processing');
    onClose();
  };

  // Condition to render nothing (Modal vanishes)
  if (!isOpen || user || isProcessing || isOptimisticClosed) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      
      <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-md relative text-center shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Manual Close Button */}
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
             {/* Pass onClose to ensure everything is synced */}
             <GoogleButton onAuthSuccess={onClose} />
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-8 uppercase tracking-widest font-bold">
          Secure Login via Google
        </p>
      </div>
    </div>
  );
};

export default AuthModal;