import React, { useMemo, useSyncExternalStore } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../redux/slices/authSlice'; 
import { toast } from 'react-toastify';

/**
 * Hook to detect mobile screen size
 */
function useIsMobile() {
  const query = useMemo(() => window.matchMedia('(max-width: 767px)'), []);
  return useSyncExternalStore(
    (callback) => {
      query.addEventListener('change', callback);
      return () => query.removeEventListener('change', callback);
    },
    () => query.matches
  );
}

const GoogleButton = ({ onAuthSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSuccess = async (credentialResponse) => {
    // This contains the JWT from Google
    const googleToken = credentialResponse.credential;
    
    // 1. Close modal immediately for better UX (Optimistic UI)
    if (onAuthSuccess) onAuthSuccess(); 
    
    // 2. Send to backend
    const resultAction = await dispatch(googleLogin(googleToken));
    
    if (googleLogin.fulfilled.match(resultAction)) {
      toast.success('Login Successful! Welcome back.');
      navigate('/');
    } else {
      toast.error('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="flex justify-center mt-4 w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          toast.error('Google Login Failed. Check if popups are blocked.');
        }}
        theme="filled_blue"
        shape="pill"
        width="280"
        /* UPDATED LOGIC:
           - redirect mode is safer for mobile chrome to avoid popup blockers.
           - useOneTap: false helps prevent conflicting overlays on mobile.
        */
        ux_mode={isMobile ? 'redirect' : 'popup'}
        useOneTap={false} 
        // Ensures the flow uses the current window for redirect
        flow="implicit" 
      />
    </div>
  );
};

export default GoogleButton;