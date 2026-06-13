import React from 'react';

const ErrorMessage = ({ message }) => (
  <div className="container mt-5">
    <div className="alert alert-danger text-center">
      <h2>Ошибка</h2>
      <p>{message}</p>
    </div>
  </div>
);

export default ErrorMessage;