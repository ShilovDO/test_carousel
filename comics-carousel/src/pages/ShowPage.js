import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchCarouselData, resetCarousel } from '../store/slices/carouselSlice';
import ImageCarousel from '../components/Carousel/ImageCarousel';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';

const ShowPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const platformId = searchParams.get('id') || '0';
  const { loading, error } = useSelector((state) => state.carousel);

  useEffect(() => {
    // Сбрасываем предыдущее состояние
    dispatch(resetCarousel());
    // Загружаем новые данные
    dispatch(fetchCarouselData(platformId));
    
    // Очистка при размонтировании
    return () => {
      dispatch(resetCarousel());
    };
  }, [dispatch, platformId]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mt-4">
      <ImageCarousel />
    </div>
  );
};

export default ShowPage;