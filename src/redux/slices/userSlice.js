import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

/**
 * THUNK: Complete Lesson
 * Updated to accept the data object correctly
 */
export const completeLessonAction = createAsyncThunk(
  'user/completeLesson',
  async (data, { rejectWithValue }) => {
    try {
      // data contains { lessonId, sentencesPracticed }
      const response = await API.post(`/user/complete-lesson/${data.lessonId}`, data);
      return response.data; // This returns { user, streak, completedLessons, ... }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save progress');
    }
  }
);

/**
 * THUNK: Fetch User Profile
 */
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/user/profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    completedLessons: [],
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.completedLessons = action.payload.completedLessons || [];
    },
    logout: (state) => {
      state.user = null;
      state.completedLessons = [];
      localStorage.removeItem('user'); // Also clear storage on logout
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile success
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.completedLessons = action.payload.completedLessons || [];
      })

      // Complete Lesson success (Updates Streak & Syncs UI)
      .addCase(completeLessonAction.fulfilled, (state, action) => {
        state.loading = false;
        
        // Use the full user object from server to ensure all stats (streak, mastered count) are in sync
        state.user = action.payload.user;
        state.completedLessons = action.payload.completedLessons;

        // Update local storage so the streak persists after page refresh
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })

      // --- Matchers ---
      .addMatcher(
        (action) => 
          action.type === 'auth/googleLogin/fulfilled' || 
          action.type === 'auth/verifyOtp/fulfilled',
        (state, action) => {
          state.user = action.payload.user;
          state.completedLessons = action.payload.user.completedLessons || [];
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => { state.loading = true; state.error = null; }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;