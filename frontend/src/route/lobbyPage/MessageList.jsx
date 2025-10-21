import { memo, useState, useEffect } from "react";
import { parseMessageWithLinks, openExternalLink } from "../../utils/linkUtils";
import { parseMessageWithImages, isGifImage } from "../../utils/imageUtils";
import ImageMessage from "../../components/ImageMessage";
import LinkPreview from "../../components/LinkPreview";
import axios from "axios";


const MessageList = memo(({ messages, userData }) => {
  const [userProfiles, setUserProfiles] = useState({});

  // 사용자 프로필 이미지 가져오기
  const fetchUserProfile = async (userId) => {
    if (userProfiles[userId]) return; // 이미 가져온 경우 스킵
    
    try {
      const response = await axios.get("/api/profile/user/info", { 
        params: { userId: userId } 
      });
      
      setUserProfiles(prev => ({
        ...prev,
        [userId]: response.data.userProfile || null
      }));
    } catch (error) {
      console.error(`사용자 ${userId} 프로필 가져오기 실패:`, error);
    }
  };

  // 메시지에서 고유한 사용자 ID들을 추출하여 프로필 정보 가져오기
  useEffect(() => {
    const uniqueUserIds = [...new Set(messages
      .filter(msg => msg.name && msg.name !== userData?.userId && msg.name !== "SYSTEM" && msg.name !== "MEMBER_JOIN")
      .map(msg => msg.name)
    )];

    uniqueUserIds.forEach(userId => {
      fetchUserProfile(userId);
    });
  }, [messages, userData?.userId]);

  return (

    <div className='chatContentStyle'>
      {
        messages.map((msg, i) => {
          // 멤버 입장 메시지인지 먼저 확인
          const isMemberJoinMessage = msg.name === "MEMBER_JOIN" || msg.userName === "MEMBER_JOIN";
          // 시스템 메시지인지 확인 (멤버 입장 메시지가 아닌 경우에만)
          const isSystemMessage = !isMemberJoinMessage && (msg.name === "SYSTEM" || msg.name === "시스템" || msg.type === "system");
          
          return (
            <div key={i}
              className={`message-wrapper ${isSystemMessage ? 'system-message' : isMemberJoinMessage ? 'member-join-message' : (msg.name == userData?.userId ? 'myChatStyle' : 'otherChatStyle')}`}>

              {/* 시스템 메시지인 경우 특별한 표시 */}
              {isSystemMessage && (
                  <div className="system-message-header">
                    <span className="system-label">채팅방 유의사항</span>
                  </div>
              )}
              
              {/* 일반 채팅 메시지 레이아웃 */}
              {!isSystemMessage && !isMemberJoinMessage && (
                <div className="message-content-wrapper">
                  {/* 프로필 아이콘과 사용자 이름 (다른 사용자 메시지만) */}
                  {msg.name !== userData?.userId && (
                    <div className="message-header">
                      <div className="profile-icon">
                        <div className="profile-avatar">
                          {userProfiles[msg.name] ? (
                            <img 
                              src={userProfiles[msg.name]} 
                              alt={msg.userName || '프로필'} 
                              className="profile-image"
                            />
                          ) : (
                            <span className="avatar-text">{msg.userName ? msg.userName.charAt(0) : '?'}</span>
                          )}
                        </div>
                      </div>
                      <div className="message-author">{msg.userName}</div>
                    </div>
                  )}
                  
                  {/* 메시지 버블과 시간 */}
                  <div className="message-bubble-wrapper">
                    <div className={`chatStyle ${isSystemMessage ? 'system-chat-content' : ''} ${isMemberJoinMessage ? 'member-join-content' : ''}`}>
                      {parseMessageWithImages(msg.message).map((part) => {
                        if (part.type === 'image') {
                          const isGif = isGifImage(part.url);
                          return (
                            <ImageMessage
                              key={part.key}
                              url={part.url}
                              alt={part.alt}
                              isGif={isGif}
                            />
                          );
                        } else if (part.type === 'text') {
                          // 텍스트 부분에서 링크 파싱
                          return parseMessageWithLinks(part.content).map((linkPart) => {
                            if (linkPart.type === 'link') {
                              return (
                                <LinkPreview key={linkPart.key} url={linkPart.content}>
                                  <span
                                    className="message-link"
                                    onClick={() => openExternalLink(linkPart.content)}
                                    style={{
                                      color: '#4A9EFF',
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      wordBreak: 'break-all'
                                    }}
                                    title="클릭하여 링크 열기"
                                  >
                                    {linkPart.content}
                                  </span>
                                </LinkPreview>
                              );
                            }
                            return <span key={linkPart.key}>{linkPart.content}</span>;
                          });
                        }
                        return <span key={part.key}>{part.content}</span>;
                      })}
                    </div>
                    
                    {/* 시간 표시 */}
                    <div className="message-time">
                      {msg.chatDate
                        ? new Date(msg.chatDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true, // 12시간제로 변경 (오후 3:58 형식)
                          })
                        : ""}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 멤버 입장 메시지 */}
              {isMemberJoinMessage && (
                <div className={`chatStyle ${isSystemMessage ? 'system-chat-content' : ''} ${isMemberJoinMessage ? 'member-join-content' : ''}`}>
                  {msg.message}
                </div>
              )}
            </div>
          );
        })
      }
    </div>
  );
});

export default MessageList;