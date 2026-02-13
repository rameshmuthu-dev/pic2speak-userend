import React, { useMemo, useSyncExternalStore } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../redux/slices/authSlice'; 
import { toast } from 'react-toastify'; // Import toast

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
    const googleToken = credentialResponse.credential;
    
    const resultAction = await dispatch(googleLogin(googleToken));
    
    if (googleLogin.fulfilled.match(resultAction)) {
      // 1. Show success notification
      toast.success('Login Successful! Welcome back.');
      
      // 2. Instant Modal close
      if (onAuthSuccess) onAuthSuccess(); 
      
      // 3. Redirect to dashboard/home
      navigate('/');
    }
  };

  return (
    <div className="flex justify-center mt-4 w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error('Google Login Failed')}
        theme="filled_blue"
        shape="pill"
        width="280"
        ux_mode={isMobile ? 'redirect' : 'popup'}
      />
    </div>
  );
};

export default GoogleButton;