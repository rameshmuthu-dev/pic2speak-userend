import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api'; 
import { toast } from 'react-toastify';

/**
 * Initial retrieval of authentication data from local storage.
 * This ensures the user remains logged in after a page refresh.
 */
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
    user: user || null,
    token: token || null,
    /**
     * CRITICAL FIX: We initialize isLoading as true if a token exists but the 
     * user object hasn't been verified/loaded yet. This stops the ProtectedRoute 
     * from triggering a redirect to the home page during the initial boot.
     */
    isLoading: !!token && !user, 
    isError: false,
    message: '',
};

/**
 * Thunk to handle Google Authentication.
 * Communicates with the backend and persists user data to localStorage.
 */
export const googleLogin = createAsyncThunk(
    'auth/googleLogin',
    async (googleToken, thunkAPI) => {
        try {
            const response = await API.post('/auth/google', { token: googleToken });
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('token', response.data.token);
                return response.data;
            } else {
                return thunkAPI.rejectWithValue(response.data.message);
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

/**
 * Thunk to request a one-time password (OTP) via email.
 */
export const requestOtp = createAsyncThunk(
    'auth/requestOtp',
    async (emailData, thunkAPI) => {
        try {
            const response = await API.post('/auth/request-otp', emailData);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

/**
 * Thunk to verify the OTP provided by the user.
 * Persists session data upon successful verification.
 */
export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async (otpData, thunkAPI) => {
        try {
            const response = await API.post('/auth/verify-otp', otpData);
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('token', response.data.token);
                return response.data;
            } else {
                return thunkAPI.rejectWithValue(response.data.message);
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

/**
 * Thunk to handle user logout.
 * Clears all authentication data from the browser's local storage.
 */
export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * Resets the error and loading states to default.
         */
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            // Google Login lifecycle handlers
            .addCase(googleLogin.pending, (state) => { 
                state.isLoading = true; 
            })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                toast.success(`Welcome ${action.payload.user.name || 'User'}!`);
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                toast.error(action.payload || 'Google Login Failed');
            })
            
            // OTP lifecycle handlers
            .addCase(requestOtp.fulfilled, (state) => { 
                state.isLoading = false; 
                toast.success('OTP sent successfully!');
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                toast.success('Login successful!');
            })
            
            // Logout lifecycle handler
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isLoading = false;
                toast.success('Logged out successfully!');
            })
            
            /** * CROSS-SLICE SYNC:
             * This listens for a successful lesson completion from the practice slice.
             * It ensures the user's streak in the Navbar is updated immediately without a refresh.
             */
            .addCase('user/completeLesson/fulfilled', (state, action) => {
                if (state.user) {
                    state.user.streak = action.payload.streak; 
                }
            });
    }
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;