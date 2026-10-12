import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';
import { storage } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ─── ASYNC THUNKS ─────────────────────────────────────────────

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { accessToken, user, studentProfile } = response.data.data;

      storage.set('accessToken', accessToken);
      storage.set('user', user);

      return { user, studentProfile, accessToken };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      const { user, studentProfile } = response.data.data;

      storage.set('user', user);

      return { user, studentProfile };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user data'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Logout even if API fails
    } finally {
      storage.remove('accessToken');
      storage.remove('refreshToken');
      storage.remove('user');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send reset email'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reset password'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.patch('/auth/change-password', passwordData);
      storage.remove('accessToken');
      storage.remove('refreshToken');
      storage.remove('user');
      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to change password'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.patch('/auth/update-profile', profileData);
      const { user } = response.data.data;
      storage.set('user', user);
      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  }
);

// ─── INITIAL STATE ────────────────────────────────────────────
const user = storage.get('user');
const accessToken = storage.get('accessToken');

const initialState = {
  user: user || null,
  studentProfile: null,
  accessToken: accessToken || null,
  isAuthenticated: !!user && !!accessToken,
  isLoading: false,
  isCheckingAuth: true,
  error: null,
};

// ─── SLICE ────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCheckingAuth: (state, action) => {
      state.isCheckingAuth = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.studentProfile = action.payload.studentProfile;
        state.accessToken = action.payload.accessToken;
        state.error = null;
        toast.success(`Welcome back, ${action.payload.user.firstName}!`);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Get Me
      .addCase(getMe.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.studentProfile = action.payload.studentProfile;
      })
      .addCase(getMe.rejected, (state) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        storage.remove('accessToken');
        storage.remove('user');
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.studentProfile = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
        toast.success('Logged out successfully');
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        toast.success(action.payload || 'Password reset email sent');
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        toast.error(action.payload);
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        toast.success(action.payload || 'Password reset successful');
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        toast.error(action.payload);
      })

      // Change Password
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        toast.success(action.payload || 'Password changed. Please login again.');
      })
      .addCase(changePassword.rejected, (state, action) => {
        toast.error(action.payload);
      })

      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        toast.success('Profile updated successfully');
      })
      .addCase(updateProfile.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export const { clearError, setCheckingAuth } = authSlice.actions;
export default authSlice.reducer;