import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { configAPI } from '../../services/api';

export const saveSettings = createAsyncThunk(
  'settings/save',
  async ({ platformId, configText, images, comicsData }) => {
    const formData = new FormData();
    formData.append('platform_id', platformId);
    formData.append('config_text', configText);
    formData.append('comics_data', JSON.stringify(comicsData));
    
    images.forEach((image) => {
      if (image.type === 'new' && image.file) {
        formData.append('images', image.file);
      }
    });

    const response = await configAPI.saveConfig(formData);
    return response.data;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    configText: '',
    images: [],
    loading: false,
    saving: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    setConfigText: (state, action) => {
      state.configText = action.payload;
    },
    addImages: (state, action) => {
      // Принимает массив изображений
      if (Array.isArray(action.payload)) {
        state.images.push(...action.payload);
      } else {
        state.images.push(action.payload);
      }
    },
    removeImage: (state, action) => {
      state.images.splice(action.payload, 1);
    },
    reorderImages: (state, action) => {
      state.images = action.payload;
    },
    updateImageDescription: (state, action) => {
      const { index, description } = action.payload;
      if (state.images[index]) {
        state.images[index].description = description;
      }
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    resetSettings: (state) => {
      state.configText = '';
      state.images = [];
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(saveSettings.fulfilled, (state) => {
        state.saving = false;
        state.successMessage = '✅ Настройки успешно сохранены!';
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Ошибка сохранения';
      });
  },
});

export const {
  setConfigText,
  addImages,
  removeImage,
  reorderImages,
  updateImageDescription,
  clearMessages,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;