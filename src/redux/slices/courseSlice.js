import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';

// 1. Fetch Categories (Phases)
// Note: Backend ippo isUnlocked and needsUpgrade data-vai anuppum
export const fetchCategories = createAsyncThunk(
  'course/fetchCategories',
  async (level, { rejectWithValue }) => {
    try {
      // Using /categories?level=Beginner etc.
      const url = level && level !== 'all' ? `/categories?level=${level}` : '/categories';
      const response = await API.get(url);
      return response.data.categories; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

// ... (Topics and Lessons fetches remain same) ...
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
      const response = await API.get(`/lessons?topic=${topicId}`);
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

const courseSlice = createSlice({
  name: 'course',
  initialState: {
    categories: [], // This will now hold isUnlocked status for each phase
    topics: [],
    lessons: [],
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
      state.currentLesson = null;
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