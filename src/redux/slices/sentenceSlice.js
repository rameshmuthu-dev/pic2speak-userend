import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchSentencesBySubLesson = createAsyncThunk(
  'sentences/fetchBySubLesson',
  async (subLessonId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/sentences/sublesson/${subLessonId}`);
      return response.data.sentences || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load sentences');
    }
  }
);

export const markSubLessonComplete = createAsyncThunk(
  'sentences/markComplete',
  async (progressData, { rejectWithValue }) => {
    try {
      const response = await API.post('/sentences/complete', progressData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update progress');
    }
  }
);

const sentenceSlice = createSlice({
  name: 'sentence',
  initialState: {
    sentences: [],
    loading: false,
    error: null,
    isMarkingComplete: false
  },
  reducers: {
    clearSentences: (state) => {
      state.sentences = [];
      state.error = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSentencesBySubLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSentencesBySubLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.sentences = action.payload;
      })
      .addCase(fetchSentencesBySubLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markSubLessonComplete.pending, (state) => {
        state.isMarkingComplete = true;
      })
      .addCase(markSubLessonComplete.fulfilled, (state) => {
        state.isMarkingComplete = false;
      })
      .addCase(markSubLessonComplete.rejected, (state, action) => {
        state.isMarkingComplete = false;
        state.error = action.payload;
      });
  },
});

export const { clearSentences } = sentenceSlice.actions;
export default sentenceSlice.reducer;