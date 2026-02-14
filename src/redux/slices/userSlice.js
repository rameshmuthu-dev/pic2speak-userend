import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

/**
 * THUNK: Fetch User Profile
 * This runs when the dashboard loads to sync the latest streak and progress.
 */
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/user/profile');
      return response.data.user; // Returning the user object from backend
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

/**
 * THUNK: Complete Lesson
 * Triggered when the user finishes a lesson. 
 * Updates the streak and adds the lesson ID to completedLessons in DB.
 */
export const completeLessonAction = createAsyncThunk(
  'user/completeLesson',
  async (data, { rejectWithValue }) => {
    try {
      // data should be { lessonId: "..." }
      const response = await API.post(`/user/complete-lesson/${data.lessonId}`, data);
      return response.data; // Expected: { success, user, streak, completedLessons }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save progress');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    completedLessons: JSON.parse(localStorage.getItem('user'))?.completedLessons || [],
    loading: false,
    error: null,
  },
  reducers: {
    // Manually set user data (e.g., after login)
    setUser: (state, action) => {
      state.user = action.payload;
      state.completedLessons = action.payload.completedLessons || [];
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    // Clear state and storage on logout
    logout: (state) => {
      state.user = null;
      state.completedLessons = [];
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    // Clear error messages in UI
    clearUserError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle Profile Fetch Success
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.completedLessons = action.payload.completedLessons || [];
        // Keep local storage in sync with latest DB data
        localStorage.setItem('user', JSON.stringify(action.payload));
      })

      // Handle Lesson Completion Success
      .addCase(completeLessonAction.fulfilled, (state, action) => {
        state.loading = false;
        // The backend returns the updated user object
        state.user = action.payload.user;
        state.completedLessons = action.payload.user.completedLessons;
        
        // Critically important: Update LocalStorage so Phase Unlock persists
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })

      // --- Common Matchers for Loading and Error States ---
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
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

export const { setUser, logout, clearUserError } = userSlice.actions;
export default userSlice.reducer;