import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import adventureMapReducer from './slices/adventureMapSlice';
import lessonProgressReducer from './slices/lessonProgressSlice';
import sceneContentReducer from './slices/sceneContentSlice';
import lessonUnlockReducer from './slices/lessonUnlockSlice';
import characterProgressReducer from './slices/characterProgressSlice';
import userProgressReducer from './slices/userProgressSlice';
import rewardReducer from './slices/rewardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    adventureMap: adventureMapReducer,
    lessonProgress: lessonProgressReducer,
    sceneContent: sceneContentReducer,
    lessonUnlock: lessonUnlockReducer,
    characterProgress: characterProgressReducer,
    userProgress: userProgressReducer,
    reward: rewardReducer,
  },
});