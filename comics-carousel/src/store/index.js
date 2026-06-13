import { configureStore } from '@reduxjs/toolkit';
import carouselReducer from './slices/carouselSlice';
import settingsReducer from './slices/settingsSlice';
import resultReducer from './slices/resultSlice';

export const store = configureStore({
  reducer: {
    carousel: carouselReducer,
    settings: settingsReducer,
    result: resultReducer,
  },
});

// Делаем store доступным глобально для получения актуального state
if (typeof window !== 'undefined') {
  window.__REDUX_STORE__ = store;
}

export default store;