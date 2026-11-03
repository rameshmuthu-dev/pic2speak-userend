import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

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

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  isAdminBlocked: false,
  currentRequestId: null,
  lessonMasterId: null,
  languageId: null,
};

const sceneContentSlice = createSlice({
  name: 'sceneContent',
  initialState,
  reducers: {
    clearSceneContentError(state) {
      state.error = null;
    },
    clearSceneContents(state) {
      state.items = [];
      state.status = 'idle';
      state.error = null;
      state.isAdminBlocked = false;
      state.currentRequestId = null;
      state.lessonMasterId = null;
      state.languageId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSceneContents.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.isAdminBlocked = false;
        state.currentRequestId = action.meta.requestId;
        // Clear stale items when lesson or language changes
        if (
          state.lessonMasterId !== String(action.meta.arg.lessonMasterId) ||
          state.languageId !== String(action.meta.arg.languageId)
        ) {
          state.items = [];
        }
        state.lessonMasterId = String(action.meta.arg.lessonMasterId);
        state.languageId = String(action.meta.arg.languageId);
      })
      .addCase(fetchSceneContents.fulfilled, (state, action) => {
        // RequestId protection: Ignore stale responses
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSceneContents.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }
        state.status = 'failed';
        state.error = action.payload;
        state.isAdminBlocked =
          typeof action.payload === 'string' &&
          action.payload.startsWith('ACCESS_BLOCKED');
      });
  },
});

export const { clearSceneContentError, clearSceneContents } = sceneContentSlice.actions;

export const selectSceneContentItems = (state) => state.sceneContent?.items || [];
export const selectSceneContentStatus = (state) => state.sceneContent?.status || 'idle';
export const selectSceneContentError = (state) => state.sceneContent?.error || null;
export const selectSceneContentIsBlocked = (state) =>
  state.sceneContent?.isAdminBlocked || false;
export const selectSceneContentLessonMasterId = (state) =>
  state.sceneContent?.lessonMasterId || null;
export const selectSceneContentLanguageId = (state) =>
  state.sceneContent?.languageId || null;

export const selectSentencesForLesson = (state) => selectSceneContentItems(state) || [];

export default sceneContentSlice.reducer;