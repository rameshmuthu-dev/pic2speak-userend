import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

/**
 * Fetches global (cross-language) progression stats for the authenticated user.
 *
 * Hits: GET /user-progress/me
 *
 * Returns:
 * {
 *   totalXP, totalCoins, rewardCount,
 *   level, currentLevelXP, nextLevelXP, progressPercent
 * }
 *
 * Level is derived on the backend from totalXP — it is never stored.
 * XP and coins reflect immutable historical lesson-completion snapshots,
 * so admin edits to lesson reward definitions never retroactively change
 * what users have earned.
 */
export const fetchMyStats = createAsyncThunk(
  'userProgress/fetchMyStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/user-progress/me');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch progression stats');
    }
  }
);

const userProgressSlice = createSlice({
  name: 'userProgress',
  initialState: {
    stats: null,      // { totalXP, totalCoins, rewardCount, level, currentLevelXP, nextLevelXP, progressPercent }
    loading: false,
    error: null,
  },
  reducers: {
    clearUserProgressError: (state) => {
      state.error = null;
    },
    resetUserProgress: (state) => {
      state.stats = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchMyStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ── Selectors ────────────────────────────────────────────────────────────────

/** Full stats object or null while loading / on error */
export const selectUserProgressStats = (state) => state.userProgress.stats;

/** True while the API call is in-flight */
export const selectUserProgressLoading = (state) => state.userProgress.loading;

/** Error message string or null */
export const selectUserProgressError = (state) => state.userProgress.error;

// Convenience field selectors — return null when stats not yet loaded
// (callers should check selectUserProgressLoading before showing values)

export const selectUserLevel       = (state) => state.userProgress.stats?.level       ?? null;
export const selectUserTotalXP     = (state) => state.userProgress.stats?.totalXP     ?? null;
export const selectUserCurrentLvlXP = (state) => state.userProgress.stats?.currentLevelXP ?? null;
export const selectUserNextLvlXP   = (state) => state.userProgress.stats?.nextLevelXP  ?? null;
export const selectUserProgressPct = (state) => state.userProgress.stats?.progressPercent ?? null;
export const selectUserTotalCoins  = (state) => state.userProgress.stats?.totalCoins  ?? null;

export const { clearUserProgressError, resetUserProgress } = userProgressSlice.actions;
export default userProgressSlice.reducer;
