import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchLessonProgressSummary = createAsyncThunk(
  'lessonProgress/fetchSummary',
  async (languageId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/lesson-progress/summary?languageId=${languageId}`);
      if (response.data.success) {
        return response.data;
      }
      return rejectWithValue('Failed to fetch lesson progress summary');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching progress summary');
    }
  }
);

export const getLessonProgress = createAsyncThunk(
  'lessonProgress/getProgress',
  async ({ lessonMasterId, languageId }, { rejectWithValue }) => {
    try {
      const response = await API.get(`/lesson-progress/${lessonMasterId}/${languageId}`);
      if (response.data.success) {
        return response.data;
      }
      return rejectWithValue('Failed to fetch lesson progress');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching progress');
    }
  }
);

export const startLesson = createAsyncThunk(
  'lessonProgress/startLesson',
  async ({ lessonMasterId, languageId }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/lesson-progress/${lessonMasterId}/${languageId}/start`);
      if (response.data.success) {
        return response.data;
      }
      return rejectWithValue('Failed to start lesson');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error starting lesson');
    }
  }
);

export const completeScene = createAsyncThunk(
  'lessonProgress/completeScene',
  async ({ lessonMasterId, languageId, sceneId }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/lesson-progress/${lessonMasterId}/${languageId}/scenes/${sceneId}/complete`);
      if (response.data.success) {
        return response.data;
      }
      return rejectWithValue('Failed to complete scene');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error completing scene');
    }
  }
);

const initialState = {
  summary: [],
  summaryCount: 0,
  currentProgress: null,
  status: 'idle',
  actionStatus: 'idle',
  error: null,
};

const lessonProgressSlice = createSlice({
  name: 'lessonProgress',
  initialState,
  reducers: {
    clearLessonProgressError: (state) => {
      state.error = null;
    },
    clearCurrentProgress: (state) => {
      state.currentProgress = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSummary
      .addCase(fetchLessonProgressSummary.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchLessonProgressSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload.summary || [];
        state.summaryCount = action.payload.count || 0;
      })
      .addCase(fetchLessonProgressSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // getProgress
      .addCase(getLessonProgress.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(getLessonProgress.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.currentProgress = action.payload.progress;
      })
      .addCase(getLessonProgress.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.payload;
      })
      // startLesson
      .addCase(startLesson.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(startLesson.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.currentProgress = action.payload.progress;
      })
      .addCase(startLesson.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.payload;
      })
      // completeScene
      .addCase(completeScene.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(completeScene.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.currentProgress = action.payload.progress;
      })
      .addCase(completeScene.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearLessonProgressError, clearCurrentProgress } = lessonProgressSlice.actions;

const EMPTY_SUMMARY = [];
export const selectLessonProgressSummary = (state) => state.lessonProgress?.summary || EMPTY_SUMMARY;
export const selectLessonProgressStatus = (state) => state.lessonProgress?.status || 'idle';
export const selectLessonProgressError = (state) => state.lessonProgress?.error || null;
export const selectCurrentLessonProgress = (state) => state.lessonProgress?.currentProgress || null;

export default lessonProgressSlice.reducer;