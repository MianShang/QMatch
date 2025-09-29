import { useState, useEffect, useRef } from 'react';

const LinkPreview = ({ url, children }) => {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const timeoutRef = useRef(null);
  const previewRef = useRef(null);

  // URL에서 도메인 추출
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Unknown';
    }
  };

  // YouTube 동영상 ID 추출
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 링크 미리보기 데이터 가져오기
  const fetchPreview = async (url) => {
    setIsLoading(true);
    try {
      // YouTube 링크인 경우 특별 처리
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (response.ok) {
          const data = await response.json();
          setPreview({
            type: 'youtube',
            title: data.title,
            thumbnail: data.thumbnail_url,
            author: data.author_name,
            videoId: videoId,
            url: url
          });
        }
      } else {
        // 일반 웹사이트의 경우 간단한 미리보기
        setPreview({
          type: 'website',
          title: getDomain(url),
          url: url,
          domain: getDomain(url)
        });
      }
    } catch (error) {
      console.error('미리보기 가져오기 실패:', error);
      setPreview({
        type: 'website',
        title: getDomain(url),
        url: url,
        domain: getDomain(url)
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 마우스 진입 시 미리보기 표시
  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (!preview) {
        fetchPreview(url);
      }
      setShowPreview(true);
    }, 500); // 0.5초 후 미리보기 표시
  };

  // 마우스 벗어날 시 미리보기 숨김
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowPreview(false);
  };

  // 미리보기 클릭 시 새 탭에서 열기
  const handlePreviewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <span
      className="link-preview-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {children}
      
      {showPreview && (
        <div
          ref={previewRef}
          className="link-preview-tooltip"
          onClick={handlePreviewClick}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            zIndex: 10000,
            backgroundColor: 'var(--discord-bg-primary)',
            border: '1px solid var(--discord-bg-tertiary)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            maxWidth: '320px',
            minWidth: '280px',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isLoading ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--discord-text-muted)' }}>
              미리보기 로딩 중...
            </div>
          ) : preview ? (
            <>
              {preview.type === 'youtube' ? (
                <div>
                  <img
                    src={preview.thumbnail}
                    alt={preview.title}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <div style={{ padding: '12px' }}>
                    <div className="preview-title">
                      {preview.title}
                    </div>
                    <div className="preview-author">
                      {preview.author}
                    </div>
                    <div className="preview-action">
                      YouTube에서 시청하기
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px' }}>
                  <div className="preview-title" style={{ fontSize: '16px', marginBottom: '8px' }}>
                    {preview.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--discord-text-muted)',
                    marginBottom: '8px',
                    wordBreak: 'break-all'
                  }}>
                    {preview.url}
                  </div>
                  <div className="preview-action">
                    클릭하여 열기
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </span>
  );
};

export default LinkPreview;
