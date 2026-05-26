import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchUnlockStatus = createAsyncThunk('unlock/fetchStatus', async () => {
  const response = await API.get('/unlock/status');
  return response.data;
});

export const updateUnlockProgress = createAsyncThunk('unlock/updateProgress', async ({ subLessonId }, { rejectWithValue }) => {
  try {
    const response = await API.post('/unlock/update', { subLessonId });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update progress');
  }
});

const unlockSlice = createSlice({
  name: 'unlock',
  initialState: {
    unlockedPhases: [],
    completedTopics: [],
    loading: false,
    error: null
  },
  reducers: {
    updateProgress: (state, action) => {
      const { categoryId, topicId } = action.payload;
      if (!state.unlockedPhases.includes(categoryId)) state.unlockedPhases.push(categoryId);
      if (!state.completedTopics.includes(topicId)) state.completedTopics.push(topicId);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnlockStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnlockStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.unlockedPhases = action.payload.unlockedPhases;
        state.completedTopics = action.payload.completedTopics;
      })
      .addCase(fetchUnlockStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateUnlockProgress.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(updateUnlockProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateProgress } = unlockSlice.actions;
export default unlockSlice.reducer;