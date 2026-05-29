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