import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api'; 
import { toast } from 'react-toastify';

const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
    user: user || null,
    token: token || null,
    isAuthenticated: !!token, 
    isLoading: false, 
    isError: false,
    message: '',
};

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (_, thunkAPI) => {
        try {
            const response = await API.get('/user/profile');
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                return response.data.user;
            }
            return thunkAPI.rejectWithValue(response.data.message);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

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

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        },
        logout: (state) => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.isError = false;
            state.message = '';
            toast.success('Logged out successfully!');
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase('course/completeLesson/fulfilled', (state, action) => {
                if (state.user) {
                    state.user.streak = action.payload.streak;
                    localStorage.setItem('user', JSON.stringify(state.user));
                }
            });
    }
});

export const { reset, logout } = authSlice.actions;
export default authSlice.reducer;