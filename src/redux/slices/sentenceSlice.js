import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

/**
 * 1. Fetch all sentences for a specific lesson (Student/User view)
 * Matches GET /api/v1/sentences/lesson/:lessonId
 */
export const fetchSentencesByLesson = createAsyncThunk(
  'sentences/fetchByLesson',
  async (lessonId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/sentences/lesson/${lessonId}`);
      // Returns the array of sentences sorted by 'order' from backend
      return response.data.sentences; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load sentences');
    }
  }
);

/**
 * 2. Create a new sentence with Image and Audio (Admin Only)
 * Matches POST /api/v1/sentences
 */
export const createSentence = createAsyncThunk(
  'sentences/create',
  async (formData, { rejectWithValue }) => {
    try {
      // Must use multipart/form-data for image and audio uploads
      const response = await API.post('/sentences', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.sentence;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create sentence');
    }
  }
);

/**
 * 3. Delete a sentence and its Cloudinary files (Admin Only)
 * Matches DELETE /api/v1/sentences/:id
 */
export const deleteSentence = createAsyncThunk(
  'sentences/delete',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/sentences/${id}`);
      return id; // Return the ID to remove from state
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete sentence');
    }
  }
);

const sentenceSlice = createSlice({
  name: 'sentence',
  initialState: {
    sentences: [],
    loading: false,
    error: null,
    success: false, 
  },
  reducers: {
    resetSentenceStatus: (state) => {
      state.success = false;
      state.error = null;
    },
    // ADDED: This fixes the export error in LessonPlayer.jsx
    clearSentences: (state) => {
      state.sentences = [];
      state.error = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetching Logic
      .addCase(fetchSentencesByLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSentencesByLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.sentences = action.payload;
      })
      .addCase(fetchSentencesByLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin: Creation Logic
      .addCase(createSentence.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.sentences.push(action.payload);
      })

      // Admin: Deletion Logic
      .addCase(deleteSentence.fulfilled, (state, action) => {
        state.sentences = state.sentences.filter(s => s._id !== action.payload);
      });
  },
});

// Export BOTH actions here
export const { resetSentenceStatus, clearSentences } = sentenceSlice.actions; 
export default sentenceSlice.reducer;