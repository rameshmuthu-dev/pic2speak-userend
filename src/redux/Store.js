import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import sentenceReducer from './slices/sentenceSlice';
import userReducer from './slices/userSlice';
import feedbackReducer from './slices/feedbackSlice';
import practiceReducer from './slices/practiceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    course: courseReducer,
    sentence: sentenceReducer,
    user: userReducer,
    feedback: feedbackReducer,
   practice: practiceReducer,

  },
});