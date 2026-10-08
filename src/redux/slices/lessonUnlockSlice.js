import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchLessonUnlocks = createAsyncThunk(
  'lessonUnlock/fetchUnlocks',
  async (languageId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/lesson-unlocks/${languageId}`);
      if (response.data.success) {
        return response.data;
      }
      return rejectWithValue('Failed to fetch lesson unlocks');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching lesson unlocks');
    }
  }
);

const initialState = {
  unlocks: [],
  loading: false,
  error: null,
};

const lessonUnlockSlice = createSlice({
  name: 'lessonUnlock',
  initialState,
  reducers: {
    clearLessonUnlocks: (state) => {
      state.unlocks = [];
      state.error = null;
    },
    setLessonUnlocked: (state, action) => {
      const { lessonMasterId, unlocked = true } = action.payload || {};
      if (!lessonMasterId) return;
      const idStr = String(lessonMasterId);
      const idx = state.unlocks.findIndex((u) => String(u?.lessonMasterId) === idStr);
      if (idx !== -1) {
        state.unlocks[idx] = { ...state.unlocks[idx], unlocked };
      } else {
        state.unlocks.push({ lessonMasterId: idStr, unlocked });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLessonUnlocks.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.unlocks = [];
      })
      .addCase(fetchLessonUnlocks.fulfilled, (state, action) => {
        state.loading = false;
        state.unlocks = action.payload.data || [];
      })
      .addCase(fetchLessonUnlocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.unlocks = [];
      });
  },
});

export const { clearLessonUnlocks, setLessonUnlocked } = lessonUnlockSlice.actions;

const EMPTY_UNLOCKS = [];

export const selectLessonUnlocks = (state) =>
  state.lessonUnlock?.unlocks ?? EMPTY_UNLOCKS;

export const selectLessonUnlockMap = createSelector(
  [selectLessonUnlocks],
  (unlocks) => {
    const map = {};
    unlocks.forEach((u) => {
      if (u?.lessonMasterId) {
        map[String(u.lessonMasterId)] = u;
      }
    });
    return map;
  }
);

export const selectLessonUnlockLoading = (state) => state.lessonUnlock?.loading ?? false;
export const selectLessonUnlockError = (state) => state.lessonUnlock?.error || null;

export default lessonUnlockSlice.reducer;