import { useState } from 'react';

// 이미지와 GIF를 파싱하는 함수
export const parseMessageWithImages = (message) => {
  const parts = [];
  let lastIndex = 0;
  
  // 이미지 마크다운 패턴: ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = imageRegex.exec(message)) !== null) {
    // 이미지 이전의 텍스트 추가
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: message.slice(lastIndex, match.index),
        key: `text-${lastIndex}-${match.index}`
      });
    }
    
    // 이미지 추가
    parts.push({
      type: 'image',
      alt: match[1],
      url: match[2],
      key: `image-${match.index}`
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // 마지막 텍스트 추가
  if (lastIndex < message.length) {
    parts.push({
      type: 'text',
      content: message.slice(lastIndex),
      key: `text-${lastIndex}-${message.length}`
    });
  }
  
  return parts;
};

// 이미지가 GIF인지 확인하는 함수
export const isGifImage = (url) => {
  return url.toLowerCase().includes('.gif') || url.toLowerCase().includes('gif');
};