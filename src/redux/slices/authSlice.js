import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api'; 
import { toast } from 'react-toastify';

/**
 * INITIAL STATE
 * Loads data from localStorage to persist the session after a browser refresh.
 */
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
    user: user || null,
    token: token || null,
    /**
     * isAuthenticated is the master toggle for your UI.
     * If this is false, the Avatar and Streak in the Navbar should hide.
     */
    isAuthenticated: !!token, 
    isLoading: !!token && !user, 
    isError: false,
    message: '',
};

/**
 * ASYNC THUNKS
 * Handles backend communication for login and OTP verification.
 */

// Google Authentication
export const googleLogin = createAsyncThunk(
    'auth/googleLogin',
    async (googleToken, thunkAPI) => {
        try {
            const response = await API.post('/auth/google', { token: googleToken });
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('token', response.data.token);
                return response.data;
            }
            return thunkAPI.rejectWithValue(response.data.message);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// OTP Verification
export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async (otpData, thunkAPI) => {
        try {
            const response = await API.post('/auth/verify-otp', otpData);
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('token', response.data.token);
                return response.data;
            }
            return thunkAPI.rejectWithValue(response.data.message);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

/**
 * AUTH SLICE
 */
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * RESET STATE
         * Clears temporary error and loading flags.
         */
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        },
        /**
         * INSTANT LOGOUT REDUCER
         * This synchronous reducer clears the state and storage simultaneously.
         * Because it's not a Thunk, it forces the UI to re-render instantly.
         */
        logout: (state) => {
            // Clear persistent storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');

            // Reset Redux state instantly
            state.user = null;
            state.token = null;
            state.isAuthenticated = false; // This removes the Avatar/Streak from UI
            state.isLoading = false;
            state.isError = false;
            state.message = '';
            
            toast.success('Logged out successfully!');
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle Successful Login states
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true; // Signals UI to show User Avatar
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            // Sync user streak updates from external actions (like lesson completion)
            .addCase('user/completeLesson/fulfilled', (state, action) => {
                if (state.user) {
                    state.user.streak = action.payload.streak; 
                }
            });
    }
});

export const { reset, logout } = authSlice.actions; // Exporting synchronous logout
export default authSlice.reducer;