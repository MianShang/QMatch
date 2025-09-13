import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onHideToast }) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onHideToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
