import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api'; 
import { toast } from 'react-toastify';

const getInitialUser = () => {
    try {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
        return null;
    }
};

const hasToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const initialUser = getInitialUser();

const initialState = {
    user: hasToken ? initialUser : null,
    token: hasToken || null,
    isAuthenticated: !!(hasToken && initialUser), 
    isLoading: false, 
    isGoogleLoggingIn: false,
    isError: false,
    message: '',
};

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (_, thunkAPI) => {
        try {
            const response = await API.get('/user/profile');
            if (response.data.success) {
                if (localStorage.getItem('token')) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }
                return response.data.user;
            }
            return thunkAPI.rejectWithValue(response.data.message);
        } catch (error) {
            if (error.response?.status === 401) {
                thunkAPI.dispatch(logout());
            }
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
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
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
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
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
            state.isGoogleLoggingIn = false;
            state.isError = false;
            state.message = '';
        },
        logout: (state) => {
            try {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.clear();
            } catch (e) {
                localStorage.clear();
            }

            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.isGoogleLoggingIn = false;
            state.isError = false;
            state.message = '';
            toast.success('Logged out successfully!');
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(googleLogin.pending, (state) => {
                state.isGoogleLoggingIn = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.isGoogleLoggingIn = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.isGoogleLoggingIn = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(verifyOtp.pending, (state) => {
                state.isGoogleLoggingIn = true;
                state.isError = false;
                state.message = '';
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.isGoogleLoggingIn = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.isGoogleLoggingIn = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(fetchUserProfile.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                if (state.token || localStorage.getItem('token')) {
                    state.isLoading = false;
                    state.user = action.payload;
                    state.isAuthenticated = true;
                }
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const { reset, logout } = authSlice.actions;
export default authSlice.reducer;