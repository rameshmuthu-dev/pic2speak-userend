import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

export const fetchCategories = createAsyncThunk(
  'course/fetchCategories',
  async (level, { rejectWithValue }) => {
    try {
      const url = level && level !== 'all' ? `/categories?level=${level}` : '/categories';
      const response = await API.get(url);
      return response.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchTopics = createAsyncThunk(
  'course/fetchTopics',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/topics/${categoryId}`);
      return response.data.topics;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch topics');
    }
  }
);

export const fetchLessonsByTopic = createAsyncThunk(
  'course/fetchLessonsByTopic',
  async (topicId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/lessons/topic/${topicId}`);
      return response.data.lessons;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch lessons');
    }
  }
);

export const fetchLessonById = createAsyncThunk(
  'course/fetchLessonById',
  async (lessonId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/lessons/${lessonId}`);
      return response.data.lesson || response.data.updatedLesson;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch lesson');
    }
  }
);

export const fetchSubLessonsByLesson = createAsyncThunk(
  'course/fetchSubLessonsByLesson',
  async (lessonId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/sublessons/lesson/${lessonId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sub-lessons');
    }
  }
);

export const fetchSingleSubLesson = createAsyncThunk(
  'course/fetchSingleSubLesson',
  async (subLessonId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/sublessons/${subLessonId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sub-lesson');
    }
  }
);

export const createSubLesson = createAsyncThunk(
  'course/createSubLesson',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await API.post('/sublessons', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create sub-lesson');
    }
  }
);

export const updateSubLesson = createAsyncThunk(
  'course/updateSubLesson',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/sublessons/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update sub-lesson');
    }
  }
);

export const deleteSubLesson = createAsyncThunk(
  'course/deleteSubLesson',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/sublessons/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete sub-lesson');
    }
  }
);

export const addSentenceToSubLesson = createAsyncThunk(
  'course/addSentenceToSubLesson',
  async ({ subLessonId, sentenceData }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/sublessons/${subLessonId}/sentence`, sentenceData);
      return { subLessonId, sentences: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add sentence');
    }
  }
);

export const updateSentenceInSubLesson = createAsyncThunk(
  'course/updateSentenceInSubLesson',
  async ({ subLessonId, sentenceId, sentenceData }, { rejectWithValue }) => {
    try {
      await API.put(`/sublessons/${subLessonId}/sentence/${sentenceId}`, sentenceData);
      return { subLessonId, sentenceId, sentenceData };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update sentence');
    }
  }
);

export const deleteSentenceFromSubLesson = createAsyncThunk(
  'course/deleteSentenceFromSubLesson',
  async ({ subLessonId, sentenceId }, { rejectWithValue }) => {
    try {
      await API.delete(`/sublessons/${subLessonId}/sentence/${sentenceId}`);
      return { subLessonId, sentenceId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete sentence');
    }
  }
);

const courseSlice = createSlice({
  name: 'course',
  initialState: {
    categories: [],
    topics: [],
    lessons: [],
    subLessons: [],
    currentLesson: null,
    loading: false,
    error: null,
    activeLevel: 'Beginner',
  },
  reducers: {
    setActiveLevel: (state, action) => {
      state.activeLevel = action.payload;
    },
    clearCourseData: (state) => {
      state.categories = [];
      state.topics = [];
      state.lessons = [];
      state.subLessons = [];
      state.currentLesson = null;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.loading = false;
        state.topics = action.payload;
      })
      .addCase(fetchLessonsByTopic.fulfilled, (state, action) => {
        state.loading = false;
        state.lessons = action.payload;
      })
      .addCase(fetchLessonById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLesson = action.payload;
      })
      .addCase(fetchSubLessonsByLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.subLessons = action.payload;
      })
      .addCase(fetchSingleSubLesson.fulfilled, (state, action) => {
        state.loading = false;
        const exists = state.subLessons.findIndex((s) => s._id === action.payload._id);
        if (exists === -1) {
          state.subLessons.push(action.payload);
        } else {
          state.subLessons[exists] = action.payload;
        }
      })
      .addCase(createSubLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.subLessons.push(action.payload);
      })
      .addCase(updateSubLesson.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.subLessons.findIndex(s => s._id === action.payload._id);
        if (index !== -1) {
          state.subLessons[index] = action.payload;
        }
      })
      .addCase(deleteSubLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.subLessons = state.subLessons.filter(s => s._id !== action.payload);
      })
      .addCase(addSentenceToSubLesson.fulfilled, (state, action) => {
        state.loading = false;
        const subLesson = state.subLessons.find(s => s._id === action.payload.subLessonId);
        if (subLesson) {
          subLesson.content = action.payload.sentences;
        }
      })
      .addCase(updateSentenceInSubLesson.fulfilled, (state, action) => {
        state.loading = false;
        const subLesson = state.subLessons.find(s => s._id === action.payload.subLessonId);
        if (subLesson && subLesson.content) {
          const sentenceIndex = subLesson.content.findIndex(sen => sen._id === action.payload.sentenceId);
          if (sentenceIndex !== -1) {
            subLesson.content[sentenceIndex] = { ...subLesson.content[sentenceIndex], ...action.payload.sentenceData };
          }
        }
      })
      .addCase(deleteSentenceFromSubLesson.fulfilled, (state, action) => {
        state.loading = false;
        const subLesson = state.subLessons.find(s => s._id === action.payload.subLessonId);
        if (subLesson && subLesson.content) {
          subLesson.content = subLesson.content.filter(sen => sen._id !== action.payload.sentenceId);
        }
      })
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { setActiveLevel, clearCourseData } = courseSlice.actions;
export default courseSlice.reducer;