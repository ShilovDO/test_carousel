import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Carousel } from 'react-bootstrap';
import { 
  setCurrentIndex, 
  setSlideTimer,
  setPlatformId,
  resetCarousel,
} from '../../store/slices/carouselSlice';
import { resultAPI } from '../../services/api';
import './ImageCarousel.css';

const ImageCarousel = () => {
  const dispatch = useDispatch();
  const { config, comics, currentIndex, slideTimers, platformId } = useSelector(
    (state) => state.carousel
  );
  const slideStartTime = useRef(Date.now());
  const [isDark, setIsDark] = useState(false);

  // Определение тёмной темы по куки
  useEffect(() => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };
    
    const tdark = getCookie('tdark');
    setIsDark(tdark === 'true');
    
    // Применяем тему к body
    if (tdark === 'true') {
      document.body.classList.add('dark-theme');
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id') || '0';
    dispatch(setPlatformId(id));
    dispatch(resetCarousel());
  }, [dispatch]);

  const saveCurrentTime = useCallback(() => {
    if (comics[currentIndex]) {
      const timeSpent = (Date.now() - slideStartTime.current) / 1000;
      
      if (timeSpent > 0) {
        const imageName = comics[currentIndex].image;
        
        dispatch(setSlideTimer({ 
          imageName, 
          time: timeSpent 
        }));
        
        slideStartTime.current = Date.now();
        return true;
      }
    }
    return false;
  }, [comics, currentIndex, dispatch]);

  const sendAllTimersToServer = useCallback(async () => {
    if (!platformId) return;
    
    saveCurrentTime();
    
    const state = window.__REDUX_STORE__?.getState();
    const currentTimers = state?.carousel?.slideTimers || {};
    
    if (Object.keys(currentTimers).length === 0) return;
    
    try {
      await resultAPI.saveTimers({
        platform_id: platformId,
        timers: currentTimers
      });
    } catch (error) {
      console.error('Ошибка отправки таймеров:', error);
    }
  }, [platformId, saveCurrentTime]);

  const handleSlideChange = useCallback((index) => {
    saveCurrentTime();
    dispatch(setCurrentIndex(index));
    
    resultAPI.setResult(index + 1, platformId).catch(console.error);
    
    setTimeout(() => {
      sendAllTimersToServer();
    }, 100);
  }, [dispatch, saveCurrentTime, sendAllTimersToServer, platformId]);

  useEffect(() => {
    const interval = setInterval(() => {
      sendAllTimersToServer();
    }, 5000);
    return () => clearInterval(interval);
  }, [sendAllTimersToServer]);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'SAVE_RESULT') {
        const { resultId } = event.data;
        await sendAllTimersToServer();
        
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ 
            type: 'TIMERS_SAVED', 
            success: true,
            resultId: resultId 
          }, '*');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendAllTimersToServer]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentTime();
      const state = window.__REDUX_STORE__?.getState();
      const currentTimers = state?.carousel?.slideTimers || {};
      
      if (platformId && Object.keys(currentTimers).length > 0) {
        const data = JSON.stringify({
          platform_id: platformId,
          timers: currentTimers
        });
        navigator.sendBeacon('/api/save_timers', data);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveCurrentTime, platformId]);

  if (!comics || comics.length === 0) {
    return (
      <div className="carousel-fullscreen d-flex align-items-center justify-content-center">
        <div className="alert alert-info text-center">Нет доступных изображений</div>
      </div>
    );
  }

  return (
    <div className={`carousel-fullscreen ${isDark ? 'dark-theme' : ''}`}>
      {/* Заголовок */}
      {config?.test && (
        <div className="carousel-header">
          <h1>{config.test}</h1>
        </div>
      )}

      {/* Карусель */}
      <div className="carousel-wrapper">
        <Carousel
          activeIndex={currentIndex}
          onSelect={handleSlideChange}
          interval={null}
          controls={comics.length > 1}
          indicators={false}
          wrap={false}
          prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon" />}
          nextIcon={<span aria-hidden="true" className="carousel-control-next-icon" />}
        >
          {comics.map((comic, index) => (
            <Carousel.Item key={comic.image || index}>
              <div className="carousel-image-container">
                <img
                  src={`/images/${comic.image}`}
                  alt={`Изображение ${index + 1}`}
                  className="carousel-image"
                />
                {comic.description && (
                  <div className="carousel-description">
                    <p>{comic.description}</p>
                  </div>
                )}
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      {/* Счетчик */}
      <div className="carousel-counter">
        <span>{currentIndex + 1} / {comics.length}</span>
      </div>
    </div>
  );
};

export default ImageCarousel;