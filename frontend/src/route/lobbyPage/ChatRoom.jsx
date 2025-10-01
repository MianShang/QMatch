import MessageList from "./MessageList";
import RoomSettingsModal from "../../modal/RoomSettingsModal/RoomSettingsModal";
import FriendInviteModal from "../../modal/FriendInviteModal/FriendInviteModal";
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
    const [showFriendInvite, setShowFriendInvite] = useState(false);

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
                    onInviteSent={handleInviteSent}
                />
            </div>
    );
}

export default ChatRoom;