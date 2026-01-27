import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../redux/slices/authSlice'; 
import { toast } from 'react-toastify';

const GoogleButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    const googleToken = credentialResponse.credential;
    const resultAction = await dispatch(googleLogin(googleToken));
    
    if (googleLogin.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  const handleError = () => {
    toast.error('Google Login Failed');
  };

  return (
    <div className="flex justify-center mt-4 w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="filled_blue"
        shape="pill"
        width="280"
      />
    </div>
  );
};

export default GoogleButton;