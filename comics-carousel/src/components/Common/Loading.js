import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loading = ({ message = 'Загрузка...' }) => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
    <div className="text-center">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">{message}</p>
    </div>
  </div>
);

export default Loading;