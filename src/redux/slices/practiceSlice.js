import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api'; 

/**
 * Thunk to save progress
 * Matches backend: POST http://localhost:8081/api/v1/progress/save
 */
export const saveLessonProgress = createAsyncThunk(
  'practice/saveProgress',
  async (lessonId, { rejectWithValue }) => {
    try {
      // Body method as requested. Ensure API.js baseURL is 'http://localhost:8081/api/v1'
      const response = await API.post('/progress/save', { lessonId });
      return response.data;
    } catch (error) {
      // Capturing the 404 from your console
      return rejectWithValue(error.response?.data?.message || 'Failed to save');
    }
  }
);

/**
 * Thunk to fetch gallery items
 * Matches backend: GET http://localhost:8081/api/v1/progress/my-practice
 */
export const fetchPracticedSentences = createAsyncThunk(
  'practice/fetchAllItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/progress/my-practice');
      // Using 'practicedItems' key as per your previous controller logic
      return response.data.practicedItems || response.data.data || []; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch');
    }
  }
);

const practiceSlice = createSlice({
  name: 'practice',
  initialState: {
    practicedSentences: [],
    loading: false,
    error: null,
    saveSuccess: false,
  },
  reducers: {
    resetProgressStatus: (state) => {
      state.saveSuccess = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPracticedSentences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPracticedSentences.fulfilled, (state, action) => {
        state.loading = false;
        state.practicedSentences = action.payload; // Correctly setting the array
      })
      .addCase(fetchPracticedSentences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveLessonProgress.fulfilled, (state) => {
        state.saveSuccess = true;
      });
  },
});

export const { resetProgressStatus } = practiceSlice.actions;
export default practiceSlice.reducer;