import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { configAPI } from '../../services/api';

export const fetchCarouselData = createAsyncThunk(
  'carousel/fetchData',
  async (platformId, { rejectWithValue }) => {
    try {
      const response = await configAPI.getConfig(platformId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const carouselSlice = createSlice({
  name: 'carousel',
  initialState: {
    config: null,
    comics: [],
    currentIndex: 0,
    loading: false,
    error: null,
    slideTimers: {}, // { imageName: totalSeconds } - хранится только в state
    isFinished: false,
    platformId: null,
  },
  reducers: {
    setCurrentIndex: (state, action) => {
      state.currentIndex = action.payload;
    },
    setSlideTimer: (state, action) => {
      const { imageName, time } = action.payload;
      // Иммутабельное обновление
      if (!state.slideTimers[imageName]) {
        state.slideTimers[imageName] = 0;
      }
      state.slideTimers[imageName] += time;
    },
    resetCarousel: (state) => {
      state.currentIndex = 0;
      state.isFinished = false;
      state.slideTimers = {}; // Очищаем таймеры
    },
    setPlatformId: (state, action) => {
      state.platformId = action.payload;
    },
    setFinished: (state, action) => {
      state.isFinished = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCarouselData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCarouselData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.config = action.payload.data;
          state.comics = action.payload.data.comics || [];
        } else {
          state.error = 'Ошибка загрузки данных';
        }
      })
      .addCase(fetchCarouselData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  setCurrentIndex,
  setSlideTimer,
  resetCarousel,
  setPlatformId,
  setFinished,
} = carouselSlice.actions;

export default carouselSlice.reducer;