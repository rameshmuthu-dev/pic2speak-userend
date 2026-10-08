import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchPublishedMap = createAsyncThunk(
  'adventureMap/fetchPublishedMap',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/adventure-map/published');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchUnlockedLessonAsset = createAsyncThunk(
  'adventureMap/fetchUnlockedLessonAsset',
  async (lessonMasterId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/adventure-map/lesson/${lessonMasterId}/asset`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchDraftMap = createAsyncThunk(
  'adventureMap/fetchDraftMap',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/adventure-map/draft');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const saveDraftMap = createAsyncThunk(
  'adventureMap/saveDraftMap',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await API.post('/adventure-map/draft', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const publishMap = createAsyncThunk(
  'adventureMap/publishMap',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.post('/adventure-map/publish');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const uploadMapAsset = createAsyncThunk(
  'adventureMap/uploadMapAsset',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await API.post('/adventure-map/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const saveMapAssetsList = createAsyncThunk(
  'adventureMap/saveMapAssetsList',
  async ({ categories, customAssets }, { rejectWithValue }) => {
    try {
      const res = await API.post('/adventure-map/assets', { categories, customAssets });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const adventureMapSlice = createSlice({
  name: 'adventureMap',
  initialState: {
    publishedMap: null,
    draftMap: null,
    loading: false,
    saving: false,
    publishing: false,
    error: null
  },
  reducers: {
    clearAdventureMapError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublishedMap.pending, (state) => {
        if (!state.publishedMap) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchPublishedMap.fulfilled, (state, action) => {
        state.loading = false;
        state.publishedMap = action.payload;
      })
      .addCase(fetchPublishedMap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchDraftMap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDraftMap.fulfilled, (state, action) => {
        state.loading = false;
        state.draftMap = action.payload;
      })
      .addCase(fetchDraftMap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(saveDraftMap.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveDraftMap.fulfilled, (state, action) => {
        state.saving = false;
        state.draftMap = action.payload;
      })
      .addCase(saveDraftMap.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      .addCase(publishMap.pending, (state) => {
        state.publishing = true;
        state.error = null;
      })
      .addCase(publishMap.fulfilled, (state, action) => {
        state.publishing = false;
        state.publishedMap = action.payload;
      })
      .addCase(publishMap.rejected, (state, action) => {
        state.publishing = false;
        state.error = action.payload;
      })

      .addCase(uploadMapAsset.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(saveMapAssetsList.fulfilled, (state, action) => {
        state.draftMap = action.payload;
      })
      .addCase(saveMapAssetsList.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      .addCase(fetchUnlockedLessonAsset.fulfilled, (state, action) => {
        if (state.publishedMap && state.publishedMap.mapItems) {
          const newBuilding = action.payload;
          const idx = state.publishedMap.mapItems.findIndex(i => String(i.id) === String(newBuilding.id));
          if (idx !== -1) {
             state.publishedMap.mapItems[idx] = {
               ...state.publishedMap.mapItems[idx],
               src: newBuilding.src,
               imageUrl: newBuilding.imageUrl,
               isLocked: false
             };
          }
        }
      });
  }
});

export const { clearAdventureMapError } = adventureMapSlice.actions;
export default adventureMapSlice.reducer;