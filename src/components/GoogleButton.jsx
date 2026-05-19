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
    const googleToken = credentialResponse.credential;
    
    if (onAuthSuccess) onAuthSuccess(); 
    
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
        ux_mode="popup"
        useOneTap={false}
        prompt="select_account"
      />
    </div>
  );
};

export default GoogleButton;