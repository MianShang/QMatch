import { memo, useState, useEffect } from "react";
import { parseMessageWithLinks, openExternalLink } from "../../utils/linkUtils";
import { parseMessageWithImages, isGifImage } from "../../utils/imageUtils";
import ImageMessage from "../../components/ImageMessage";
import LinkPreview from "../../components/LinkPreview";
import MessageContextMenu from "../../components/MessageContextMenu";
import { useMessagePin } from "../../hooks/chat/useMessagePin";
import { useMessageDelete } from "../../hooks/chat/useMessageDelete";
import axios from "@axios";


const MessageList = memo(({ messages, userData, roomId, isFriendChat = false, isPinnedMessageHidden = false, onHidePinnedMessage, setFriendMessages }) => {
  const [userProfiles, setUserProfiles] = useState({});
  const [userNames, setUserNames] = useState({});
  const [contextMenu, setContextMenu] = useState({
    isVisible: false,
    position: { x: 0, y: 0 },
    messageId: null,
    isPinned: false,
    messageContent: '',
    messageData: null
  });
  
  const { togglePinMessage } = useMessagePin();
  const { deleteMessage } = useMessageDelete();

  // 우클릭 핸들러
  const handleContextMenu = (e, messageId, isPinned, messageContent, messageData) => {
    e.preventDefault();
    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      messageId,
      isPinned,
      messageContent,
      messageData
    });
  };

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = () => {
    setContextMenu({
      isVisible: false,
      position: { x: 0, y: 0 },
      messageId: null,
      isPinned: false,
      messageContent: '',
      messageData: null
    });
  };

  // 메시지 고정/해제 핸들러
  const handleTogglePin = async (messageId, roomId, isFriendChat, messageData = null) => {
    try {
      await togglePinMessage(messageId, roomId, isFriendChat, messageData);
    } catch (error) {
      console.error('메시지 고정/해제 실패:', error);
    }
  };

  // 메시지 삭제 핸들러
  const handleDeleteMessage = async (messageId, roomId, isFriendChat, messageData = null) => {
    if (!messages || !Array.isArray(messages)) return;
    
    try {
      await deleteMessage(messageId, roomId, isFriendChat, messageData, userData.userId);
      
      // 삭제 성공 시 즉시 UI 업데이트
      if (isFriendChat && setFriendMessages) {
        setFriendMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, message: "삭제된 메시지입니다", isDeleted: true };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('메시지 삭제 실패:', error);
    }
  };

  // 사용자 프로필 이미지와 이름 가져오기
  const fetchUserProfile = async (userId) => {
    if (userProfiles[userId] && userNames[userId]) return; // 이미 가져온 경우 스킵
    
    try {
      const response = await axios.get("/api/profile/user/info", { 
        params: { userId: userId } 
      });
      
      setUserProfiles(prev => ({
        ...prev,
        [userId]:response.data.userProfile || null
      }));
      
      setUserNames(prev => ({
        ...prev,
        [userId]: response.data.userName
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

  // 같은 사용자가 연속으로 보낸 메시지인지 확인하는 함수
  const isFirstMessageFromUser = (currentMsg, currentIndex) => {
    // 시스템 메시지나 멤버 입장 메시지는 항상 표시
    if (currentMsg.name === "SYSTEM" || currentMsg.name === "시스템" || 
        currentMsg.type === "system" || currentMsg.name === "MEMBER_JOIN" || 
        currentMsg.userName === "MEMBER_JOIN") {
      return false;
    }

    // 첫 번째 메시지면 표시
    if (currentIndex === 0) {
      return true;
    }

    const prevMsg = messages[currentIndex - 1];
    
    // 이전 메시지가 시스템 메시지나 멤버 입장 메시지면 현재 메시지가 첫 번째
    if (prevMsg.name === "SYSTEM" || prevMsg.name === "시스템" || 
        prevMsg.type === "system" || prevMsg.name === "MEMBER_JOIN" || 
        prevMsg.userName === "MEMBER_JOIN") {
      return true;
    }

    // 다른 사용자가 보낸 메시지면 현재 메시지가 첫 번째
    if (currentMsg.name !== prevMsg.name) {
      return true;
    }

    // 같은 사용자가 보낸 메시지인 경우, 시간을 비교
    if (currentMsg.chatDate && prevMsg.chatDate) {
      const currentTime = new Date(currentMsg.chatDate);
      const prevTime = new Date(prevMsg.chatDate);
      
      // 다른 분이면 현재 메시지가 첫 번째
      return currentTime.getMinutes() !== prevTime.getMinutes() || 
             currentTime.getHours() !== prevTime.getHours() ||
             currentTime.getDate() !== prevTime.getDate();
    }

    return false;
  };

  // 같은 분에 보낸 메시지들 중 마지막 메시지인지 확인하는 함수
  const isLastMessageInMinute = (currentMsg, currentIndex) => {
    // 시스템 메시지나 멤버 입장 메시지는 시간 표시하지 않음
    if (currentMsg.name === "SYSTEM" || currentMsg.name === "시스템" || 
        currentMsg.type === "system" || currentMsg.name === "MEMBER_JOIN" || 
        currentMsg.userName === "MEMBER_JOIN") {
      return false;
    }

    // 다음 메시지가 없으면 마지막 메시지
    if (currentIndex === messages.length - 1) {
      return true;
    }

    const nextMsg = messages[currentIndex + 1];
    
    // 다음 메시지가 시스템 메시지나 멤버 입장 메시지면 현재 메시지가 마지막
    if (nextMsg.name === "SYSTEM" || nextMsg.name === "시스템" || 
        nextMsg.type === "system" || nextMsg.name === "MEMBER_JOIN" || 
        nextMsg.userName === "MEMBER_JOIN") {
      return true;
    }

    // 다른 사용자가 보낸 메시지면 현재 메시지가 마지막
    if (currentMsg.name !== nextMsg.name) {
      return true;
    }

    // 같은 사용자가 보낸 메시지인 경우, 시간을 비교
    if (currentMsg.chatDate && nextMsg.chatDate) {
      const currentTime = new Date(currentMsg.chatDate);
      const nextTime = new Date(nextMsg.chatDate);
      
      // 같은 분이 아니면 현재 메시지가 마지막
      return currentTime.getMinutes() !== nextTime.getMinutes() || 
             currentTime.getHours() !== nextTime.getHours() ||
             currentTime.getDate() !== nextTime.getDate();
    }

    return true;
  };

  // 고정된 메시지와 일반 메시지 분리 (고정 메시지는 하나만, 원래 위치에도 남아있음)
  const pinnedMessage = messages.find(msg => msg.isPinned);
  const regularMessages = messages; // 모든 메시지를 표시 (고정된 메시지도 원래 위치에 표시)

  return (
    <div className='chatContentStyle'>
      {/* 고정된 메시지 영역 (하나만) */}
      {pinnedMessage && !isPinnedMessageHidden && (
        <div className="pinned-messages-container">
          <div className="pinned-header">
            <span className="pin-icon">📌</span>
            <span className="pinned-title">고정된 메시지</span>
            <button 
              className="pinned-close-btn"
              onClick={onHidePinnedMessage}
              title="고정 메시지 숨기기"
            >
              ✕
            </button>
          </div>
          <div className="pinned-messages-list">
            {(() => {
              const msg = pinnedMessage;
              const isSystemMessage = msg.name === "SYSTEM" || msg.name === "시스템" || msg.type === "system";
              const isMemberJoinMessage = msg.name === "MEMBER_JOIN" || msg.userName === "MEMBER_JOIN";
              const isDeletedMessage = msg.message === "삭제된 메시지입니다" || msg.userName === "DELETED" || msg.isDeleted === true;
              const shouldShowProfile = true; // 고정 메시지는 항상 프로필 표시
              const shouldShowTime = true; // 고정 메시지는 항상 시간 표시
              
              return (
                <div className={`pinned-message-item ${msg.name == userData?.userId ? 'myChatStyle' : 'otherChatStyle'} ${isDeletedMessage ? 'deleted-message' : ''}`}>
                  
                  {!isSystemMessage && !isMemberJoinMessage && (
                    <div className={`message-content-wrapper ${msg.name !== userData?.userId && !shouldShowProfile ? 'no-profile' : ''}`}>
                      {/* 프로필 아이콘과 사용자 이름 (삭제된 메시지 제외) */}
                      {msg.name !== userData?.userId && shouldShowProfile && !isDeletedMessage && (
                        <div className="message-header">
                          <div className="profile-icon">
                            <div className="profile-avatar">
                              {userProfiles[msg.name] ? (
                                <img 
                                  src={import.meta.env?.VITE_API_URL +userProfiles[msg.name]} 
                                  alt={msg.userName || '프로필'} 
                                  className="profile-image"
                                />
                              ) : (
                                <div className="default-profile-icon">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="message-author">
                            {userNames[msg.name] || msg.userName || msg.name || '알 수 없음'}
                          </div>
                        </div>
                      )}
                      
                      {/* 메시지 버블과 시간 */}
                      <div className="message-bubble-wrapper">
                        <div 
                          className={`chatStyle pinned-chat-style`}
                        >
                          {parseMessageWithImages(msg.message).map((part) => {
                            if (part.type === 'image') {
                              const isGif = isGifImage(import.meta.env?.VITE_API_URL + part.url);
                              return (
                                <ImageMessage
                                  key={import.meta.env?.VITE_API_URL + part.key}
                                  url={import.meta.env?.VITE_API_URL + part.url}
                                  alt={part.alt}
                                  isGif={isGif}
                                />
                              );
                            } else if (part.type === 'text') {
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
                        {shouldShowTime && (
                          <div className="message-time">
                            {msg.chatDate
                              ? new Date(msg.chatDate).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 일반 메시지 영역 */}
      {
        regularMessages.map((msg, i) => {
          // 멤버 입장 메시지인지 먼저 확인
          const isMemberJoinMessage = msg.name === "MEMBER_JOIN" || msg.userName === "MEMBER_JOIN";
          // 삭제된 메시지인지 확인 (일반 채팅: userName === "DELETED", 친구 채팅: isDeleted === true)
          const isDeletedMessage = msg.message === "삭제된 메시지입니다" || msg.userName === "DELETED" || msg.isDeleted === true;
          // 시스템 메시지인지 확인 (멤버 입장 메시지가 아닌 경우에만)
          const isSystemMessage = !isMemberJoinMessage && (msg.name === "SYSTEM" || msg.name === "시스템" || msg.type === "system");
          
          // 프로필과 이름 표시 여부 결정
          const shouldShowProfile = isFirstMessageFromUser(msg, i);
          // 시간 표시 여부 결정
          const shouldShowTime = isLastMessageInMinute(msg, i);
          
          return (
            <div key={i}
              className={`message-wrapper ${isSystemMessage ? 'system-message' : isMemberJoinMessage ? 'member-join-message' : (msg.name == userData?.userId ? 'myChatStyle' : 'otherChatStyle')} ${isDeletedMessage ? 'deleted-message' : ''}`}>

              {/* 시스템 메시지인 경우 특별한 표시 */}
              {isSystemMessage && (
                <div className="system-message-content">
                  <div className="system-message-header">
                    <span className="system-label">채팅방 유의사항</span>
                  </div>
                  <div className={`chatStyle system-chat-content`}>
                    {msg.message}
                  </div>
                </div>
              )}
              
              {/* 일반 채팅 메시지 레이아웃 */}
              {!isSystemMessage && !isMemberJoinMessage && (
                <div className={`message-content-wrapper ${msg.name !== userData?.userId && !shouldShowProfile ? 'no-profile' : ''}`}>
                  {/* 프로필 아이콘과 사용자 이름 (다른 사용자 메시지의 첫 번째만, 삭제된 메시지 제외) */}
                  {msg.name !== userData?.userId && shouldShowProfile && !isDeletedMessage && (
                    <div className="message-header">
                      <div className="profile-icon">
                        <div className="profile-avatar">
                          {userProfiles[msg.name] ? (
                            <img 
                              src={import.meta.env?.VITE_API_URL + userProfiles[msg.name]} 
                              alt={msg.userName || '프로필'} 
                              className="profile-image"
                            />
                          ) : (
                            <div className="default-profile-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="message-author">
                        {userNames[msg.name] || msg.userName || msg.name || '알 수 없음'}
                      </div>
                    </div>
                  )}
                  
                  {/* 메시지 버블과 시간 */}
                  <div className="message-bubble-wrapper">
                    <div 
                      className={`chatStyle ${isSystemMessage ? 'system-chat-content' : ''} ${isMemberJoinMessage ? 'member-join-content' : ''}`}
                      onContextMenu={(e) => {
                        // 시스템 메시지, 멤버 입장 메시지, 삭제된 메시지는 우클릭 비활성화
                        // 실시간 메시지는 senderId로, DB 저장 메시지는 id로 식별
                        if (!isSystemMessage && !isMemberJoinMessage && !isDeletedMessage && (msg.id || msg.senderId)) {
                          const messageId = msg.id || msg.senderId; // 실시간 메시지는 senderId 사용
                          handleContextMenu(e, messageId, msg.isPinned || false, msg.message, msg); // 메시지 전체 데이터 전달
                        } else {
                          console.log('메시지 버블 우클릭 무시됨');
                        }
                      }}
                    >
                      {parseMessageWithImages(msg.message).map((part) => {
                        if (part.type === 'image') {
                          const isGif = isGifImage(import.meta.env?.VITE_API_URL + part.url);
                          return (
                            <ImageMessage
                              key={import.meta.env?.VITE_API_URL + part.key}
                              url={import.meta.env?.VITE_API_URL + part.url}
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
                    
                    {/* 시간 표시 (같은 분의 마지막 메시지만) */}
                    {shouldShowTime && (
                      <div className="message-time">
                        {msg.chatDate
                          ? new Date(msg.chatDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true, // 12시간제로 변경 (오후 3:58 형식)
                            })
                          : ""}
                      </div>
                    )}
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
      
      {/* 컨텍스트 메뉴 */}
      <MessageContextMenu
        isVisible={contextMenu.isVisible}
        position={contextMenu.position}
        onClose={closeContextMenu}
        messageId={contextMenu.messageId}
        roomId={roomId}
        isPinned={contextMenu.isPinned}
        onTogglePin={handleTogglePin}
        onDeleteMessage={handleDeleteMessage}
        messageContent={contextMenu.messageContent}
        messageData={contextMenu.messageData}
        isFriendChat={isFriendChat}
        currentUserId={userData?.userId}
      />
    </div>
  );
});

export default MessageList;