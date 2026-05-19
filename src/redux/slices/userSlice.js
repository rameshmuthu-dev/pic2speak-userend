import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/user/profile');
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const completeLessonAction = createAsyncThunk(
  'user/completeLesson',
  async (data, { rejectWithValue }) => {
    try {
      const response = await API.post(`/user/complete-lesson/${data.lessonId}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save progress');
    }
  }
);

const getInitialUser = () => {
  try {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    return null;
  }
};

const initialUser = getInitialUser();

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: initialUser,
    completedLessons: initialUser?.completedLessons || [],
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      if (localStorage.getItem('token')) {
        state.user = action.payload;
        state.completedLessons = action.payload.completedLessons || [];
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload));
      }
    },
    logout: (state) => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      state.user = null;
      state.completedLessons = [];
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearUserError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        if (localStorage.getItem('token')) {
          state.loading = false;
          state.user = action.payload;
          state.completedLessons = action.payload.completedLessons || [];
          state.isAuthenticated = true;
          localStorage.setItem('user', JSON.stringify(action.payload));
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(completeLessonAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeLessonAction.fulfilled, (state, action) => {
        if (state.isAuthenticated && localStorage.getItem('token') && action.payload?.user) {
          state.loading = false;
          state.user = action.payload.user;
          state.completedLessons = action.payload.user.completedLessons || [];
          state.isAuthenticated = true;
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(completeLessonAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, logout, clearUserError } = userSlice.actions;
export default userSlice.reducer;