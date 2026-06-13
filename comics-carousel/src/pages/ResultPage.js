import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchFullResult, clearResult } from '../store/slices/resultSlice';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Container, Row, Col, Card, ListGroup, Badge } from 'react-bootstrap';

const ResultPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get('id');
  
  const { resultData, comics, timers, configTitle, loading, error } = useSelector(
    (state) => state.result
  );

  useEffect(() => {
    if (resultId) {
      dispatch(fetchFullResult(resultId));
    }
    
    return () => {
      dispatch(clearResult());
    };
  }, [dispatch, resultId]);

  // Форматирование времени
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '—';
    const numSeconds = parseFloat(seconds);
    if (isNaN(numSeconds)) return '—';
    
    const mins = Math.floor(numSeconds / 60);
    const secs = Math.floor(numSeconds % 60);
    
    if (mins > 0) {
      return `${mins} мин ${secs} сек`;
    }
    return `${secs} сек`;
  };

  // Вычисление общего времени
  const totalTime = Object.values(timers).reduce((sum, time) => {
    return sum + (parseFloat(time) || 0);
  }, 0);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!resultData) return <ErrorMessage message="Результат не найден" />;

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0 text-center">
            {configTitle || 'Результаты просмотра'}
          </h4>
        </Card.Header>
        
        <Card.Body>
          {/* Информация о результате */}
          <div className="text-center mb-4">
            <Badge bg="info" className="fs-6 px-3 py-2">
              Результат №{resultData.id}
            </Badge>
            {resultData.result && (
              <p className="mt-2 text-muted">
                Последний просмотренный слайд: <strong>№{resultData.result}</strong>
              </p>
            )}
          </div>

          {/* Список всех изображений */}
          <ListGroup variant="flush">
            {comics.map((comic, index) => {
              const imageName = comic.image;
              const timeSpent = timers[imageName];
              const isViewed = timeSpent !== undefined && timeSpent !== null;

              return (
                <ListGroup.Item 
                  key={index}
                  className={`d-flex align-items-center p-3 ${isViewed ? '' : 'opacity-75'}`}
                >
                  <Row className="w-100 align-items-center">
                    {/* Миниатюра изображения */}
                    <Col xs={3} md={2}>
                      <div 
                        style={{
                          width: '100%',
                          paddingBottom: '75%',
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa',
                        }}
                      >
                        <img
                          src={`/images/${imageName}`}
                          alt={comic.description || `Изображение ${index + 1}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+0J7RiNC40LHQutCwPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      </div>
                    </Col>

                    {/* Информация об изображении */}
                    <Col xs={6} md={7}>
                      <div>
                        <strong>Изображение {index + 1}</strong>
                        {comic.description && (
                          <p className="text-muted mb-0 small">{comic.description}</p>
                        )}
         
                      </div>
                    </Col>

                    {/* Время просмотра */}
                    <Col xs={3} md={3} className="text-end">
                      {isViewed ? (
                        <Badge bg="success" className="fs-6 px-3 py-2">
                          {timeSpent}
                        </Badge>
                      ) : (
                        <span className="text-muted fs-5">—</span>
                      )}
                    </Col>
                  </Row>
                </ListGroup.Item>
              );
            })}
          </ListGroup>

          {/* Общее время */}
          {totalTime > 0 && (
            <div className="text-center mt-4">
              <Card className="bg-light">
                <Card.Body>
                  <h5>Общее время просмотра</h5>
                  <Badge bg="primary" className="fs-5 px-4 py-2">
                    {totalTime}
                  </Badge>
                </Card.Body>
              </Card>
            </div>
          )}

          {/* Если нет просмотренных изображений */}
          {Object.keys(timers).length === 0 && (
            <div className="text-center mt-4 text-muted">
              <p>Нет данных о времени просмотра</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResultPage;