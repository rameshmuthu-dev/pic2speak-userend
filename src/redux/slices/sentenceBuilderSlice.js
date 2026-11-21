import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchLanguages = createAsyncThunk(
  'sentenceBuilder/fetchLanguages',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/languages');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchLessons = createAsyncThunk(
  'sentenceBuilder/fetchLessons',
  async (languageId, { rejectWithValue }) => {
    try {
      const uRes = await API.get(`/lesson-unlocks/${languageId}`);
      if (uRes.data?.success && Array.isArray(uRes.data?.data)) {
        const unlockData = uRes.data.data;

        const summaryRes = await API.get(`/lesson-progress/summary?languageId=${languageId}`);
        const summaryLessons = summaryRes.data?.success && Array.isArray(summaryRes.data?.data) 
          ? summaryRes.data.data 
          : [];

        const mergedLessons = unlockData.map((item) => {
          const foundSummary = summaryLessons.find(
            (s) => String(s.lessonMasterId || s._id) === String(item.lessonMasterId)
          );
          return {
            ...(foundSummary || {}),
            _id: item.lessonMasterId,
            lessonMasterId: item.lessonMasterId,
            order: item.order,
            lessonOrder: item.order,
            isLocked: !item.unlocked,
            unlocked: item.unlocked,
          };
        });

        if (mergedLessons.length > 0) {
          return mergedLessons;
        }
      }

      const summaryRes = await API.get(`/lesson-progress/summary?languageId=${languageId}`);
      if (summaryRes.data?.success && Array.isArray(summaryRes.data?.data)) {
        return summaryRes.data.data;
      }

      return [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSentences = createAsyncThunk(
  'sentenceBuilder/fetchSentences',
  async ({ masterId, languageId }, { rejectWithValue }) => {
    try {
      const res = await API.get(`/scene-contents/user/${masterId}/${languageId}`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSentenceBuilderProgress = createAsyncThunk(
  'sentenceBuilder/fetchProgress',
  async ({ languageId, lessonMasterId }, { rejectWithValue }) => {
    try {
      const res = await API.get(`/lesson-progress/sentence-builder-progress/${languageId}/${lessonMasterId}`);
      if (res.data?.success) {
        return res.data.currentSentenceIndex;
      }
      return 0;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const saveSentenceBuilderProgress = createAsyncThunk(
  'sentenceBuilder/saveProgress',
  async ({ languageId, lessonMasterId, currentSentenceIndex }, { rejectWithValue }) => {
    try {
      const res = await API.post('/lesson-progress/sentence-builder-progress', {
        languageId,
        lessonMasterId,
        currentSentenceIndex,
      });
      if (res.data?.success) {
        return res.data.currentSentenceIndex;
      }
      return currentSentenceIndex;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const sentenceBuilderSlice = createSlice({
  name: 'sentenceBuilder',
  initialState: {
    languages: [],
    lessons: [],
    sentences: [],
    currentSentenceIndex: 0,
    lessonsLoading: false,
    lessonsError: null,
    sentencesLoading: false,
    sentencesError: null,
    progressLoading: false,
  },
  reducers: {
    setCurrentSentenceIndex: (state, action) => {
      state.currentSentenceIndex = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLanguages.fulfilled, (state, action) => {
        state.languages = action.payload;
      })
      .addCase(fetchLessons.pending, (state) => {
        state.lessonsLoading = true;
        state.lessonsError = null;
      })
      .addCase(fetchLessons.fulfilled, (state, action) => {
        state.lessonsLoading = false;
        state.lessons = action.payload;
      })
      .addCase(fetchLessons.rejected, (state, action) => {
        state.lessonsLoading = false;
        state.lessonsError = action.payload;
      })
      .addCase(fetchSentences.pending, (state) => {
        state.sentencesLoading = true;
        state.sentencesError = null;
      })
      .addCase(fetchSentences.fulfilled, (state, action) => {
        state.sentencesLoading = false;
        state.sentences = action.payload;
      })
      .addCase(fetchSentences.rejected, (state, action) => {
        state.sentencesLoading = false;
        state.sentencesError = action.payload;
      })
      .addCase(fetchSentenceBuilderProgress.pending, (state) => {
        state.progressLoading = true;
      })
      .addCase(fetchSentenceBuilderProgress.fulfilled, (state, action) => {
        state.progressLoading = false;
        state.currentSentenceIndex = action.payload;
      })
      .addCase(fetchSentenceBuilderProgress.rejected, (state) => {
        state.progressLoading = false;
      })
      .addCase(saveSentenceBuilderProgress.fulfilled, (state, action) => {
        state.currentSentenceIndex = action.payload;
      });
  },
});

export const { setCurrentSentenceIndex } = sentenceBuilderSlice.actions;
export default sentenceBuilderSlice.reducer;