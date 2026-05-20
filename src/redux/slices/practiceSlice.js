import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const saveLessonProgress = createAsyncThunk(
  'practice/saveProgress',
  async (lessonId, { rejectWithValue }) => {
    try {
      const response = await API.post('/progress/save', { lessonId });
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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch');
    }
  }
);

export const fetchPracticedLessonSentences = createAsyncThunk(
  'practice/fetchLessonSentences',
  async (lessonId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/progress/my-practice/lesson/${lessonId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sentences');
    }
  }
);

const practiceSlice = createSlice({
  name: 'practice',
  initialState: {
    practicedGallery: [],
    currentLessonSentences: [],
    loading: false,
    sentencesLoading: false,
    error: null,
    saveSuccess: false,
  },
  reducers: {
    resetProgressStatus: (state) => {
      state.saveSuccess = false;
      state.error = null;
    },
    clearCurrentSentences: (state) => {
      state.currentLessonSentences = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPracticedGallery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPracticedGallery.fulfilled, (state, action) => {
        state.loading = false;
        state.practicedGallery = action.payload.practicedItems || [];
      })
      .addCase(fetchPracticedGallery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveLessonProgress.fulfilled, (state) => {
        state.saveSuccess = true;
      })
      .addCase(fetchPracticedLessonSentences.pending, (state) => {
        state.sentencesLoading = true;
        state.error = null;
      })
      .addCase(fetchPracticedLessonSentences.fulfilled, (state, action) => {
        state.sentencesLoading = false;
        state.currentLessonSentences = action.payload.sentences || [];
      })
      .addCase(fetchPracticedLessonSentences.rejected, (state, action) => {
        state.sentencesLoading = false;
        state.error = action.payload;
      });
  },
});

export const { resetProgressStatus, clearCurrentSentences } = practiceSlice.actions;
export default practiceSlice.reducer;