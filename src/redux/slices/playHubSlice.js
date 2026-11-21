import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchGamesConfig = createAsyncThunk(
  'playHub/fetchGamesConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/games');
      if (response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch games');
    }
  }
);

const playHubSlice = createSlice({
  name: 'playHub',
  initialState: {
    games: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGamesConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGamesConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.games = action.payload;
      })
      .addCase(fetchGamesConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default playHubSlice.reducer;