import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

// Route that is protected in App.jsx and shown to every logged-in user.
const ADVENTURE_MAP_PATH = '/adventure-map';

const GoogleButton = ({ onAuthSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    const googleToken = credentialResponse.credential;

    if (!googleToken) {
      toast.error('Google authentication failed. Please try again.');
      return;
    }

    try {
      const resultAction = await dispatch(googleLogin(googleToken));

      if (googleLogin.fulfilled.match(resultAction)) {
        toast.success('Login Successful! Welcome back.');

        // Close the authentication modal only after successful login.
        if (onAuthSuccess) {
          onAuthSuccess();
        }

        // Logged-in users always land on the Adventure Map.
        // (replace: true keeps the landing page out of the back-button history)
        navigate(ADVENTURE_MAP_PATH, { replace: true });
      } else {
        toast.error(
          resultAction.payload || 'Authentication failed. Please try again.'
        );
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Something went wrong. Please try again.');
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