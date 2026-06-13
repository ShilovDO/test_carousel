import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  Container, Card, Form, Button, Row, Col, Modal,
  Spinner, Alert, Badge, Image
} from 'react-bootstrap';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { fetchCarouselData } from '../store/slices/carouselSlice';
import {
  setConfigText,
  addImages,
  removeImage,
  reorderImages,
  updateImageDescription,
  saveSettings,
  clearMessages,
  resetSettings,
} from '../store/slices/settingsSlice';
import Loading from '../components/Common/Loading';

// ========================
// Draggable Image Item
// ========================
const DraggableImage = ({ image, index, isSelected, onSelect, onRemove, onMove }) => {
  const ref = React.useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'IMAGE',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'IMAGE',
    hover: (draggedItem, monitor) => {
      if (draggedItem.index !== index) {
        onMove(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  drag(drop(ref));

  return (
    <Col xs={6} sm={4} md={3} lg={3} className="mb-3">
      <Card
        ref={ref}
        className={`position-relative h-100 ${isDragging ? 'opacity-50' : ''} ${isSelected ? 'border-primary border-2' : ''}`}
        style={{ cursor: 'grab' }}
        onClick={() => onSelect(index)}
      >
        <div className="position-absolute top-0 start-0 m-1" style={{ zIndex: 2 }}>
          <Badge bg={isSelected ? 'primary' : 'secondary'} pill>{index + 1}</Badge>
        </div>
        <Button
          variant="danger"
          size="sm"
          className="position-absolute top-0 end-0 m-1 rounded-circle p-0"
          style={{ width: '24px', height: '24px', zIndex: 2, fontSize: '12px', lineHeight: '1' }}
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
        >
          ✕
        </Button>

        <div style={{ height: '180px', overflow: 'hidden' }}>
          <Image
            src={image.dataUrl || `/images/${image.name}`}
            alt="Preview"
            fluid
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+0J7RiNC40LHQutCwPC90ZXh0Pjwvc3ZnPg==';
            }}
          />
        </div>
      </Card>
    </Col>
  );
};

// ========================
// Settings Page
// ========================
const SettingsPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const platformId = searchParams.get('id') || '';

  const { configText, images, saving, error, successMessage } = useSelector(
    (state) => state.settings
  );

  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  // Загрузка данных
  const loadConfigData = useCallback(async () => {
    try {
      const result = await dispatch(fetchCarouselData(platformId)).unwrap();
      
      if (result.success && result.data) {
        // Сначала очищаем
        dispatch(resetSettings());
        
        // Устанавливаем заголовок
        dispatch(setConfigText(result.data.test || ''));
        
        // Загружаем изображения
        const existingImages = (result.data.comics || []).map((comic) => ({
          name: comic.image,
          description: comic.description || '',
          type: 'existing',
          file: null,
          dataUrl: null,
        }));
        
        if (existingImages.length > 0) {
          dispatch(addImages(existingImages));
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  }, [dispatch, platformId]);

  useEffect(() => {
    if (platformId) {
      setIsLoading(true);
      loadConfigData().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    return () => {
      dispatch(resetSettings());
      dispatch(clearMessages());
    };
  }, []); // Только при монтировании

  // Обработчики файлов
  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    processFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileSelect = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const processFiles = (files) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        dispatch(addImages([{
          name: file.name,
          description: '',
          type: 'new',
          file: file,
          dataUrl: event.target.result,
        }]));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMoveImage = useCallback((dragIndex, hoverIndex) => {
    const newImages = [...images];
    const [draggedItem] = newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, draggedItem);
    dispatch(reorderImages(newImages));
    // Обновляем индекс выделенного изображения
    if (selectedImageIndex === dragIndex) {
      setSelectedImageIndex(hoverIndex);
    }
  }, [images, dispatch, selectedImageIndex]);

  const handleSelectImage = (index) => {
    setSelectedImageIndex(selectedImageIndex === index ? null : index);
  };

  const handleRemoveClick = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      dispatch(removeImage(deleteIndex));
      if (selectedImageIndex === deleteIndex) {
        setSelectedImageIndex(null);
      } else if (selectedImageIndex > deleteIndex) {
        setSelectedImageIndex(selectedImageIndex - 1);
      }
    }
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const handleDescriptionChange = (value) => {
    if (selectedImageIndex !== null) {
      dispatch(updateImageDescription({ index: selectedImageIndex, description: value }));
    }
  };

  const handleSave = () => {
    if (!configText.trim()) return;

    const comicsData = images.map((img, index) => ({
      order: index,
      description: img.description || '',
      image: img.type === 'existing' ? img.name : null,
    }));

    dispatch(saveSettings({
      platformId,
      configText,
      images,
      comicsData,
    }));
  };

  const handleCancel = () => {
    setIsLoading(true);
    setSelectedImageIndex(null);
    loadConfigData().finally(() => setIsLoading(false));
  };

  if (isLoading) {
    return <Loading message="Загрузка конфигурации..." />;
  }

  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  return (
    <DndProvider backend={HTML5Backend}>
      <Container fluid="lg" className="py-4">
        {/* Заголовок */}
        <Card className="mb-4 shadow-sm">
          <Card.Body className="text-center py-3">
            <h3 className="mb-1">🎨 Настройка карусели</h3>
            <Badge bg="info">ID: {platformId}</Badge>
          </Card.Body>
        </Card>

        {/* Уведомления */}
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => dispatch(clearMessages())}>
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" dismissible onClose={() => dispatch(clearMessages())}>
            {error}
          </Alert>
        )}

        <Row>
          {/* Левая колонка */}
          <Col lg={4}>
            <Card className="shadow-sm mb-3">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">📝 Настройки</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Название карусели:</Form.Label>
                  <Form.Control
                    type="text"
                    maxlength={50}
                    placeholder="Введите название..."
                    value={configText}
                    onChange={(e) => dispatch(setConfigText(e.target.value))}
                  />
                </Form.Group>

                {/* Панель выделенного изображения */}
                {selectedImage && (
                  <Card className="border-primary">
                    <Card.Header className="bg-primary text-white py-2">
                      <small className="fw-bold">📷 Изображение №{selectedImageIndex + 1}</small>
                    </Card.Header>
                    <Card.Body className="p-2">
                      <div className="text-center mb-2">
                        <Image
                          src={selectedImage.dataUrl || `/images/${selectedImage.name}`}
                          alt="Selected"
                          fluid
                          style={{ maxHeight: '150px', objectFit: 'contain' }}
                        />
                      </div>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Описание:</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          maxlength={250}
                          placeholder="Введите описание изображения..."
                          value={selectedImage.description || ''}
                          onChange={(e) => handleDescriptionChange(e.target.value)}
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                )}

                {/* Кнопки */}
                <div className="d-grid gap-2 mt-3">
                  <Button
                    variant="success"
                    onClick={handleSave}
                    disabled={saving || !configText.trim()}
                  >
                    {saving ? (
                      <><Spinner size="sm" className="me-2" />Сохранение...</>
                    ) : (
                      '💾 Сохранить всё'
                    )}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    ↩ Отменить изменения
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Правая колонка - Изображения */}
          <Col lg={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">🖼️ Изображения ({images.length})</h5>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  + Добавить
                </Button>
              </Card.Header>
              <Card.Body>
                {/* Зона Drag & Drop */}
                <div
                  className="border rounded-3 p-4 mb-4 text-center bg-light"
                  style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <div style={{ fontSize: '2rem' }}>📁</div>
                  <p className="mb-1 text-muted">Перетащите изображения сюда</p>
                  <small className="text-muted">или нажмите для выбора</small>
                  <Form.Control
                    id="fileInput"
                    type="file"
                    multiple
                    accept="image/*"
                    className="d-none"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Сетка */}
                {images.length > 0 ? (
                  <Row>
                    {images.map((img, index) => (
                      <DraggableImage
                        key={`${img.name}-${index}`}
                        image={img}
                        index={index}
                        isSelected={selectedImageIndex === index}
                        onSelect={handleSelectImage}
                        onRemove={handleRemoveClick}
                        onMove={handleMoveImage}
                      />
                    ))}
                  </Row>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <div style={{ fontSize: '3rem' }}>🖼️</div>
                    <p>Нет изображений</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Модалка удаления */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
          <Modal.Header closeButton>
            <Modal.Title>Удалить?</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <p>Удалить изображение №{deleteIndex !== null ? deleteIndex + 1 : ''}?</p>
            {deleteIndex !== null && images[deleteIndex] && (
              <Image
                src={images[deleteIndex].dataUrl || `/images/${images[deleteIndex].name}`}
                alt="Preview"
                fluid
                style={{ maxHeight: '150px', objectFit: 'contain' }}
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>Отмена</Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>Удалить</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </DndProvider>
  );
};

export default SettingsPage;