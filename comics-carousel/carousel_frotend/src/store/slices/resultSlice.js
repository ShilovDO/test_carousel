import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { resultAPI } from '../../services/api';

export const fetchFullResult = createAsyncThunk(
  'result/fetchFullResult',
  async (resultId, { rejectWithValue }) => {
    try {
      const response = await resultAPI.getResultWithTimers(resultId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const resultSlice = createSlice({
  name: 'result',
  initialState: {
    resultData: null,      // Данные результата (id, result)
    comics: [],             // Все изображения из конфигурации
    timers: {},             // Таймеры просмотра { imageName: time }
    configTitle: '',        // Заголовок конфигурации
    loading: false,
    error: null,
  },
  reducers: {
    clearResult: (state) => {
      state.resultData = null;
      state.comics = [];
      state.timers = {};
      state.configTitle = '';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFullResult.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFullResult.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.resultData = action.payload.data.result;
          state.comics = action.payload.data.comics || [];
          state.timers = action.payload.data.timers || {};
          state.configTitle = action.payload.data.configTitle || '';
        }
      })
      .addCase(fetchFullResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Ошибка загрузки результата';
      });
  },
});

export const { clearResult } = resultSlice.actions;
export default resultSlice.reducer;