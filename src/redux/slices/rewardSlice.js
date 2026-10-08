import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import API from "../../api/api";

/**
 * Fetch current user's reward totals.
 *
 * Global:
 *   GET /rewards/my-rewards
 *
 * Language-specific:
 *   GET /rewards/my-rewards?languageId=...
 */
export const fetchMyRewards = createAsyncThunk(
  "reward/fetchMyRewards",
  async ({ languageId } = {}, { rejectWithValue }) => {
    try {
      const params = {};

      if (languageId) {
        params.languageId = languageId;
      }

      const response = await API.get("/rewards/my-rewards", {
        params,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to fetch reward totals"
      );
    }
  }
);

const initialState = {
  totalXP: 0,
  totalCoins: 0,
  totalGems: 0,

  status: "idle",
  error: null,
};

const rewardSlice = createSlice({
  name: "reward",

  initialState,

  reducers: {
    clearRewardError: (state) => {
      state.error = null;
    },

    resetRewards: (state) => {
      state.totalXP = 0;
      state.totalCoins = 0;
      state.totalGems = 0;
      state.status = "idle";
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRewards.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })

      .addCase(fetchMyRewards.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;

        state.totalXP = Number(action.payload?.totalXP) || 0;
        state.totalCoins = Number(action.payload?.totalCoins) || 0;
        state.totalGems = Number(action.payload?.totalGems) || 0;
      })

      .addCase(fetchMyRewards.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload || "Failed to fetch reward totals";
      });
  },
});

/* Actions */
export const {
  clearRewardError,
  resetRewards,
} = rewardSlice.actions;

/* Selectors */
export const selectTotalXP = (state) =>
  state.reward?.totalXP ?? 0;

export const selectTotalCoins = (state) =>
  state.reward?.totalCoins ?? 0;

export const selectTotalGems = (state) =>
  state.reward?.totalGems ?? 0;

export const selectRewardStatus = (state) =>
  state.reward?.status ?? "idle";

export const selectRewardError = (state) =>
  state.reward?.error ?? null;

export default rewardSlice.reducer;