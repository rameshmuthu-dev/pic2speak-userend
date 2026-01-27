import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/api';
import { toast } from 'react-toastify';

/**
 * THUNK: Submit Feedback
 * This function sends the user's rating, category, and comments to the backend.
 * It uses the 'protect' middleware on the backend to identify the user.
 */
export const submitFeedbackAction = createAsyncThunk(
  'feedback/submit',
  async (feedbackData, { rejectWithValue }) => {
    try {
      // Sends a POST request to /api/feedback/submit
      const response = await API.post('/feedback/submit', feedbackData);
      return response.data;
    } catch (error) {
      // Returns the error message from the server or a default message
      const message = error.response?.data?.message || 'Feedback submission failed';
      return rejectWithValue(message);
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState: {
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
  },
  reducers: {
    /**
     * Resets the feedback state so the user can submit again 
     * or to clear success messages from the UI.
     */
    resetFeedbackState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Triggered when the request is sent but not yet finished
      .addCase(submitFeedbackAction.pending, (state) => {
        state.isLoading = true;
      })
      // Triggered when the backend successfully saves the feedback
      .addCase(submitFeedbackAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message;
        // Show a success notification to the user
        toast.success(action.payload.message || 'Thank you for your feedback!');
      })
      // Triggered if the request fails (e.g., server error or validation error)
      .addCase(submitFeedbackAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        // Show an error notification to the user
        toast.error(action.payload || 'Failed to submit feedback');
      });
  },
});

export const { resetFeedbackState } = feedbackSlice.actions;
export default feedbackSlice.reducer;