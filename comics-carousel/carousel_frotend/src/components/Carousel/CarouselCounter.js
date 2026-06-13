import React from 'react';

const CarouselCounter = ({ current, total }) => {
  return (
    <div className="text-center mt-3">
      <span className="text-muted">
        {current} / {total}
      </span>
    </div>
  );
};

export default CarouselCounter;