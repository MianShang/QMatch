// URL 패턴을 감지하는 정규식
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// 텍스트에서 URL을 찾아서 링크로 변환하는 함수
export const parseMessageWithLinks = (text) => {
  if (!text) return text;
  
  const parts = text.split(URL_REGEX);
  
  return parts.map((part, index) => {
    // URL인지 확인
    if (URL_REGEX.test(part)) {
      return {
        type: 'link',
        content: part,
        key: `link-${index}`
      };
    }
    // 일반 텍스트인 경우
    return {
      type: 'text',
      content: part,
      key: `text-${index}`
    };
  }).filter(part => part.content); // 빈 문자열 제거
};

// URL이 유효한지 확인하는 함수
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// 외부 링크를 새 탭에서 열기
export const openExternalLink = (url) => {
  if (isValidUrl(url)) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
