import React, { useState, useRef, useEffect } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ onImageSelect, onClose, isOpen }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreview(null);
      setDragActive(false);
    }
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onImageSelect(selectedFile);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // isOpen이 false이면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div className="image-upload-overlay" onClick={onClose}>
      <div className="image-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="image-upload-header">
          <h3>이미지 업로드</h3>
          <button className="image-upload-close" onClick={onClose}>×</button>
        </div>
        
        <div className="image-upload-content">
          {!selectedFile ? (
            <div 
              className={`image-upload-dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-content">
                <div className="dropzone-icon">📷</div>
                <p className="dropzone-text">이미지를 드래그하거나 클릭하여 선택하세요</p>
                <p className="dropzone-subtext">JPG, PNG, GIF 지원 (최대 10MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="image-preview-container">
              <div className="image-preview">
                <img src={preview} alt="미리보기" />
              </div>
              <div className="image-info">
                <p className="image-name">{selectedFile.name}</p>
                <p className="image-size">{formatFileSize(selectedFile.size)}</p>
                <p className="image-type">{selectedFile.type}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="image-upload-actions">
          <button className="cancel-button" onClick={handleCancel}>
            취소
          </button>
          <button 
            className="upload-button" 
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            업로드
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
