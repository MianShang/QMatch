import MessageList from "./MessageList";
import RoomSettingsModal from "../../modal/RoomSettingsModal/RoomSettingsModal";
import FriendInviteModal from "../../modal/FriendInviteModal/FriendInviteModal";
import { useState, useContext } from "react";
import { LogContext } from "../../App.jsx";
import { FaPhone, FaPhoneSlash } from "react-icons/fa6";
import EmojiPicker from "../../components/EmojiPicker";
import ImageUpload from "../../components/ImageUpload";
import axios from "axios";

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
    client,
}) {

    const [showRoomSettings, setShowRoomSettings] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);

    const [showFriendInvite, setShowFriendInvite] = useState(false);

    const { 
        joinedVoice, 
        setJoinedVoice, 
        voiceChatRef, 
        currentVoiceRoomId, 
        setCurrentVoiceRoomId,
        setVoiceChatRoomId,
        friendVoiceChatActive,
        setFriendVoiceChatActive,
        currentFriendVoiceChat,
        setCurrentFriendVoiceChat,
        friends
    } = useContext(LogContext);

    const handleSend = () => {
        if (selectedRoom) {
            sendMessage();
        } else if (selectedFriendRoom) {
            sendFriendMessage();
        }
    };

    const handleInviteSent = (friend) => {
        console.log(`${friend.userName}님에게 초대를 보냈습니다.`);
        setShowFriendInvite(false);
        };

    // 친구 닉네임 가져오기
    const getFriendName = () => {
        if (!selectedFriendRoom || !friends) return "친구";
        const friend = friends.find(f => f.userId === selectedFriendRoom.friendId);
        return friend ? friend.userName : "친구";
    };

    // 1대1 친구 음성채팅 시작/종료 처리
    const handleFriendVoiceChat = () => {
        if (!selectedFriendRoom) return;

        if (friendVoiceChatActive) {
            // 음성채팅 종료 처리
            if (voiceChatRef.current) {
                voiceChatRef.current.leaveChannel();
            }
            setFriendVoiceChatActive(false);
            setCurrentFriendVoiceChat(null);
            setJoinedVoice(false);
            setCurrentVoiceRoomId(null);
            setVoiceChatRoomId(null);
        } else {
            // 음성채팅 시작 - 친구 ID 기반 고유 채널 ID 생성
            const myUserId = userData.userId;
            const friendUserId = selectedFriendRoom.friendId;
            
            // 두 사용자 ID를 정렬하여 일관된 채널 ID 생성
            const sortedIds = [myUserId, friendUserId].sort();
            const friendChannelId = `friend_${sortedIds[0]}_${sortedIds[1]}`;
            
            setCurrentVoiceRoomId(friendChannelId);
            setVoiceChatRoomId(friendChannelId);
            setFriendVoiceChatActive(true);
            
            // 친구 정보를 전역 상태에 저장
            const friendInfo = friends.find(f => f.userId === friendUserId);
            setCurrentFriendVoiceChat({
                friendId: friendUserId,
                friendName: friendInfo ? friendInfo.userName : '친구',
                channelId: friendChannelId
            });
            
            // VoiceChat 컴포넌트의 joinChannel 함수 호출
            if (voiceChatRef.current) {
                voiceChatRef.current.joinChannel(friendChannelId);
            }
        }
    }

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

                // 이미지 URL을 바로 전송 (입력창 거치지 않음)
                const imageMessage = `![이미지](${imageUrl})`;
                if (selectedRoom) {
                    // STOMP 발행 + 저장 API 직접 호출
                    if (client && imageMessage.trim()) {
                        // 메세지 발행 로직
                        client.publish({
                            destination: `/app/chat/${selectedRoom.id}`,
                            body: JSON.stringify({ 
                                name: userData.userId, 
                                message: imageMessage 
                            }),
                        });

                        // 채팅 내역 저장 API
                        axios.post('/api/user/add/userchatlist', {
                            chatRoom: selectedRoom.id,
                            chatContent: imageMessage,
                            userId: userData.userId
                        }).then((res) => {
                            console.log('이미지 메세지 저장 성공');
                        }).catch((err) => {
                            console.error('이미지 메세지 저장 실패:', err);
                        });

                        // 안읽은 메세지 처리
                        axios.post('/api/chat/isread', {
                            chatRoom: selectedRoom.id,
                            chatContent: imageMessage,
                            userId: userData.userId
                        }).then((res) => {
                            console.log('이미지 메세지 저장 성공2');
                        }).catch((err) => {
                            console.error('이미지 메세지 저장 실패2:', err);
                        });
                    }
                } else if (selectedFriendRoom) {
                    // 친구 채팅도 동일하게 처리
                    if (client && imageMessage.trim()) {
                        client.publish({
                            destination: `/app/friend-chat/${selectedFriendRoom.friendId}`,
                            body: JSON.stringify({ 
                                name: userData.userId, 
                                message: imageMessage 
                            }),
                        });

                        axios.post('/api/friendship-chat/send', {
                            friendshipChatRoomId: selectedFriendRoom.friendshipChatRoomId,
                            chatContent: imageMessage,
                            userId: userData.userId
                        }).then((res) => {
                            console.log('친구 이미지 메세지 저장 성공');
                        }).catch((err) => {
                            console.error('친구 이미지 메세지 저장 실패:', err);
                        });
                    }
                }
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
                            <button 
                                className="roomSettingsBtn"
                                onClick={() => setShowFriendInvite(true)}
                                title="친구 초대"
                            >
                                👥
                            </button>
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

                {/* 친구 1대1 채팅 헤더 */}
                {selectedFriendRoom && (
                    <div className="chatRoomHeader">
                        <div className="chatRoomInfo">
                            <h3 className="chatRoomTitle">{getFriendName()}</h3>
                            <div className="chatRoomMeta">
                                <span className="gameName">1:1 채팅</span>
                            </div>
                        </div>
                        <div className="chatRoomActions">
                            {/* 1대1 친구 음성채팅 버튼 */}
                            <button 
                                className={`voice-chat-btn ${friendVoiceChatActive ? 'voice-chat-active' : ''}`}
                                onClick={handleFriendVoiceChat}
                                title={friendVoiceChatActive ? "음성채팅 종료" : "음성채팅 시작"}
                            >
                                {friendVoiceChatActive ? (
                                    <FaPhoneSlash className="voice-chat-icon" />
                                ) : (
                                    <FaPhone className="voice-chat-icon" />
                                )}
                            </button>
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

                {/* 친구 초대 모달 */}
                <FriendInviteModal
                    open={showFriendInvite}
                    onClose={() => setShowFriendInvite(false)}
                    room={selectedRoom}
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