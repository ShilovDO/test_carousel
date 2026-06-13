import React, { useEffect, useState } from 'react';
import Loading from './Loading';

const ProtectedRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверка для локальной разработки
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    // Получение сообщения от родительского окна
    const handleMessage = (event) => {
      if (event.data === 'secret_key') {
        setIsAuthorized(true);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Таймаут ожидания
    const timeout = setTimeout(() => {
      if (!isAuthorized) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [isAuthorized]);

  if (isLoading) {
    return <Loading message="Проверка прав доступа..." />;
  }

  if (!isAuthorized) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h2>Ошибка доступа</h2>
          <p>У вас нет прав для просмотра этой страницы</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;