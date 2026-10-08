/**
 * sceneContentSlice.js
 *
 * Uses the new userAuth endpoint to fetch scene contents for a specific lesson and language.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

// ---------------------------------------------------------------------------
// Thunk: fetchSceneContents
// ---------------------------------------------------------------------------
export const fetchSceneContents = createAsyncThunk(
  'sceneContent/fetchUserSceneContents',
  async ({ lessonMasterId, languageId }, { rejectWithValue }) => {
    try {
      const response = await API.get(`/scene-contents/user/${lessonMasterId}/${languageId}`);
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue('Failed to fetch scene contents');
    } catch (error) {
      if (error.response?.status === 403) {
        return rejectWithValue('ACCESS_BLOCKED: Scene content API access denied.');
      }
      return rejectWithValue(
        error.response?.data?.message || 'Error fetching scene contents'
      );
    }
  }
);

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------
const initialState = {
  items: [],
  status: 'idle',
  error: null,
  isAdminBlocked: false,
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------
const sceneContentSlice = createSlice({
  name: 'sceneContent',
  initialState,
  reducers: {
    clearSceneContentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSceneContents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.isAdminBlocked = false;
      })
      .addCase(fetchSceneContents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload; // Already formatted by backend
      })
      .addCase(fetchSceneContents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.isAdminBlocked =
          typeof action.payload === 'string' &&
          action.payload.startsWith('ACCESS_BLOCKED');
      });
  },
});

export const { clearSceneContentError } = sceneContentSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------
export const selectSceneContentItems = (state) => state.sceneContent?.items || [];
export const selectSceneContentStatus = (state) => state.sceneContent?.status || 'idle';
export const selectSceneContentError = (state) => state.sceneContent?.error || null;
export const selectSceneContentIsBlocked = (state) =>
  state.sceneContent?.isAdminBlocked || false;

/**
 * Derived selector: get sorted sentences.
 * Backend already filters by lessonMasterId and languageId and formats fields.
 */
export const selectSentencesForLesson = () => (state) => {
  return selectSceneContentItems(state) || [];
};

export default sceneContentSlice.reducer;

