import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api'; 

export const saveLessonProgress = createAsyncThunk(
  'practice/saveProgress',
  async (lessonId, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.post('/progress/save', { lessonId });
      dispatch(fetchPracticedGallery()); 
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save');
    }
  }
);

export const fetchPracticedGallery = createAsyncThunk(
  'practice/fetchGallery',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/progress/my-practice');
      return response.data.practicedItems || []; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch');
    }
  }
);

const practiceSlice = createSlice({
  name: 'practice',
  initialState: {
    practicedGallery: [], 
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
      .addCase(fetchPracticedGallery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPracticedGallery.fulfilled, (state, action) => {
        state.loading = false;
        state.practicedGallery = action.payload; 
      })
      .addCase(fetchPracticedGallery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveLessonProgress.pending, (state) => {
        state.saveSuccess = false;
        state.error = null;
      })
      .addCase(saveLessonProgress.fulfilled, (state) => {
        state.saveSuccess = true;
      })
      .addCase(saveLessonProgress.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { resetProgressStatus } = practiceSlice.actions;
export default practiceSlice.reducer;