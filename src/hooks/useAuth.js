import { useGoogleLogin } from '@react-oauth/google';
import API from '../api/api'; // Ungal api.js file-ai import seigirom
export const useAuth = () => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
       console.log("Google Response:", tokenResponse);
      try {
        // Google-idham irundhu varum access_token
        const googleToken = tokenResponse.id_token;

        // API.post moolam backend-ukku anuppugirom
        const response = await API.post('/auth/google', {
          token: googleToken,
        });

        // Backend success endraal token matrum user data-vai save seivom
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Login aanavudan homepage-kku redirect seiya
          window.location.href = '/'; 
        }
      } catch (error) {
        console.error("Login Error:", error);
        alert("Login failed! Please check your backend.");
      }
    },
    onError: (error) => console.log('Login Failed:', error),
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return { login, logout };
};