import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../redux/slices/authSlice'; 
import { toast } from 'react-toastify';

const GoogleButton = ({ onAuthSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    // This contains the JWT from Google
    const googleToken = credentialResponse.credential;
    
    // 1. Close modal immediately for better UX
    if (onAuthSuccess) onAuthSuccess(); 
    
    // 2. Send to backend via Redux Thunk
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
        // Force popup mode for all devices to avoid Redirect URI issues
        ux_mode="popup"
        useOneTap={false}
      />
    </div>
  );
};

export default GoogleButton;