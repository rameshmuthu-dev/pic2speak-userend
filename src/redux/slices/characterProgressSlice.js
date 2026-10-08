import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchCharacterProgress = createAsyncThunk(
  'characterProgress/fetch',
  async (languageId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/character-progress/${languageId}`);
      return res.data.progress;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateCharacterProgress = createAsyncThunk(
  'characterProgress/update',
  async ({ languageId, lessonMasterId }, { rejectWithValue }) => {
    try {
      const res = await API.put(`/character-progress/${languageId}`, {
        currentLessonMasterId: lessonMasterId,
      });
      return res.data.progress;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const characterProgressSlice = createSlice({
  name: 'characterProgress',
  initialState: {
    progress: null,
    loading: false,
    updating: false,
    error: null,
  },
  reducers: {
    clearCharacterProgress: (state) => {
      state.progress = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchCharacterProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
        // Clear stale previous-language progress immediately to avoid flash
        state.progress = null;
      })
      .addCase(fetchCharacterProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.progress = action.payload;
      })
      .addCase(fetchCharacterProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Keep progress null — do not fabricate a position
        state.progress = null;
      })
      // update
      .addCase(updateCharacterProgress.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateCharacterProgress.fulfilled, (state, action) => {
        state.updating = false;
        state.progress = action.payload;
      })
      .addCase(updateCharacterProgress.rejected, (state, action) => {
        state.updating = false;
        // Do not optimistically update — keep previous persisted progress
        console.error('[CharacterProgress] update failed:', action.payload);
      });
  },
});

export const { clearCharacterProgress } = characterProgressSlice.actions;

export const selectCharacterProgress = (state) => state.characterProgress?.progress || null;
export const selectCharacterProgressLoading = (state) => state.characterProgress?.loading ?? false;
export const selectCharacterProgressUpdating = (state) => state.characterProgress?.updating ?? false;

export default characterProgressSlice.reducer;
