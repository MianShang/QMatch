import { useState } from 'react';

const ImageMessage = ({ url, alt, isGif }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const handleImageLoad = () => {
    setImageLoading(false);
  };
  
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };
  
  if (imageError) {
    return (
      <div className="image-error">
        <span className="error-icon">🖼️</span>
        <span className="error-text">이미지를 불러올 수 없습니다</span>
      </div>
    );
  }
  
  return (
    <div className="message-image-container">
      {imageLoading && (
        <div className="image-loading">
          <div className="loading-spinner"></div>
          <span>로딩 중...</span>
        </div>
      )}
      <img
        src={url}
        alt={alt || '업로드된 이미지'}
        className={`message-image ${isGif ? 'gif-image' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      {isGif && (
        <div className="gif-indicator">
          <span>GIF</span>
        </div>
      )}
    </div>
  );
};

export default ImageMessage;
