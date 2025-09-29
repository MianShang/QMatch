import MessageList from "./MessageList";
import RoomSettingsModal from "../../modal/RoomSettingsModal/RoomSettingsModal";
import EmojiPicker from "../../components/EmojiPicker";
import ImageUpload from "../../components/ImageUpload";
import { useState } from "react";

function ChatRoom({
    userData,
    selectedRoom,
    selectedFriendRoom,
    messages,
    friendMessages,
    input,
    setInput,
    sendMessage,
    sendFriendMessage,
    messageContainerRef,
    onRoomUpdated,
}) {

    const [showRoomSettings, setShowRoomSettings] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);

    const handleSend = () => {
        if (selectedRoom) {
            sendMessage();
        } else if (selectedFriendRoom) {
            sendFriendMessage();
        }
    };

    const handleEmojiSelect = (emoji) => {
        setInput(prev => prev + emoji);
    };

    const handleImageSelect = async (file) => {
        try {
            // 파일 크기 검증 (10MB 제한)
            if (file.size > 10 * 1024 * 1024) {
                alert('파일 크기는 10MB를 초과할 수 없습니다.');
                return;
            }

            // FormData 생성
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userData.userId);
            
            // 서버에 이미지 업로드
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                const imageUrl = result.url;
                
                // 이미지 URL을 메시지로 전송
                const imageMessage = `![이미지](${imageUrl})`;
                setInput(prev => prev + imageMessage);
            } else {
                alert('이미지 업로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            alert('이미지 업로드 중 오류가 발생했습니다.');
        }
    };
    
    return (
            <div className="chatSize">
                {/* 다대다 채팅방 헤더 */}
                {selectedRoom && (
                    <div className="chatRoomHeader">
                        <div className="chatRoomInfo">
                            <h3 className="chatRoomTitle">{selectedRoom.name}</h3>
                            <div className="chatRoomMeta">
                                <span className="gameName">{selectedRoom.gameName}</span>
                                <span className="userCount">
                                    {selectedRoom.currentUsers}/{selectedRoom.maxUsers}
                                </span>
                            </div>
                        </div>
                        <div className="chatRoomActions">
                            {selectedRoom.hostUserId === userData?.userId && (
                                <span className="hostBadge">방장</span>
                            )}
                            {selectedRoom.hostUserId === userData?.userId && (
                                <button 
                                    className="roomSettingsBtn"
                                    onClick={() => setShowRoomSettings(true)}
                                    title="방 설정"
                                >
                                    ⚙️
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* 메시지 영역 */}
                <div ref={messageContainerRef} className="scroll-container chatDivStyle">
                    {selectedRoom ? (
                        <MessageList messages={messages} userData={userData} />
                    ) : selectedFriendRoom ? (
                        <MessageList messages={friendMessages} userData={userData} />
                    ) : (
                        <div className="empty-chat-container">
                            <div className="empty-chat-logo">
                                <img src="/qmatchLogo.png" alt="QMatch" className="qmatch-logo-image" />
                            </div>
                            <p className="empty-chat-text">채팅방을 선택하여 대화를 시작하세요</p>
                        </div>
                    )}
                </div>

                {/* 입력창 */}
                {(selectedRoom || selectedFriendRoom) && (
                    <div className="inputSize">
                        <button 
                            className="emoji-button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="이모지 추가"
                        >
                            😊
                        </button>
                        <button 
                            className="image-upload-button"
                            onClick={() => setShowImageUpload(true)}
                            title="이미지 업로드"
                        >
                            📷
                        </button>
                        <input
                            className="chatInputStyle"
                            type="text"
                            placeholder="메시지를 입력하세요..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSend();
                            }}
                        />
                        <button className="chatButtonStyle" onClick={handleSend}>
                            ➤
                        </button>
                    </div>
                )}

                {/* 방 설정 모달 */}
                <RoomSettingsModal
                    open={showRoomSettings}
                    onClose={() => setShowRoomSettings(false)}
                    room={selectedRoom}
                    onRoomUpdated={onRoomUpdated}
                />

                {/* 이모지 피커 */}
                <EmojiPicker
                    isOpen={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    onEmojiSelect={handleEmojiSelect}
                />

                {/* 이미지 업로드 */}
                <ImageUpload
                    isOpen={showImageUpload}
                    onClose={() => setShowImageUpload(false)}
                    onImageSelect={handleImageSelect}
                />
            </div>
    );
}

export default ChatRoom;