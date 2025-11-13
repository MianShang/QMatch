import './list.css';
import './friendListPage.css';
import { useFriendsinventory } from '../../../hooks/friends/useFriendInventory';
import { FaCheck } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { useFriendResponse } from '../../../hooks/friends/useFriendResponse';
import { useFriendDelete } from '../../../hooks/friends/useFriendDelete';
import { useContext } from 'react';
import { LogContext } from '../../../App.jsx';


export function FriendInventory({ bottomToggle, userId }) {

    // useFriendsinventory 훅의 반환값을 올바르게 비구조화 할당
    const { responseUsers, loading, error } = useFriendsinventory(userId, bottomToggle);
    const { deleteFriend } = useFriendDelete();
    
    // 친구 요청 개수 새로고침을 위한 함수 가져오기
    const { refreshPendingCount } = useContext(LogContext);

    // 렌더링할 제목을 결정
    const title = (bottomToggle === "friends" ? "친구 요청" : "차단된");

    // 로딩 중일 때 로딩 메시지를 표시
    if (loading) {
        return (
            <div className='inventoryOverlay'>
                {/* 로딩 메시지 추가 */}
                <div className="chatCard">
                    <span className="chatCardTitle">로딩 중...</span>
                </div>
            </div>
        );
    }

    // 에러 발생 시 에러 메시지를 표시
    if (error) {
        return (
            <div className='inventoryOverlay'>
                {/* 에러 메시지 추가 */}
                <p className="chatCardTitle">데이터를 불러오는 데 실패했습니다: {error}</p>
            </div>
        );
    }

    // 데이터가 있을 때 목록을 렌더링
    return (
        <div className="inventoryOverlay chatListScrollWrapper chatListScroll">
            {responseUsers.length > 0 ? (
                responseUsers.map(RequestUser => (
                    <div key={RequestUser.userId} className="chatCard">
                        <div className="chatCardHeader">
                            <div className="profile-image-container">
                                <img
                                    src={RequestUser.userProfile || "https://placehold.co/45"}
                                    alt="프로필 이미지"
                                    className="chatCardImage"
                                />
                            </div>
                            <span className="chatCardTitle ellipsis">{RequestUser.userNickname || RequestUser.userNickName || RequestUser.userName}</span>
                            {bottomToggle === "friends" && (
                                <FaCheck
                                    size={20}
                                    color="#32CD32"
                                    style={{ marginRight: "-10px" }}
                                    onClick={async () => {
                                        const result = await useFriendResponse(RequestUser.userId, userId, 'accept');
                                        if (result.success && refreshPendingCount) {
                                            // 수락 후 친구 요청 개수 즉시 업데이트
                                            refreshPendingCount();
                                        }
                                    }}
                                    className='CheckBox'
                                />
                            )}
                            <FaXmark
                                size={25}
                                color="red"
                                style={{ marginRight: "5px" }}
                                onClick={async () => {
                                    if (bottomToggle === "friends") {
                                        const result = await useFriendResponse(RequestUser.userId, userId, "reject");
                                        if (result.success && refreshPendingCount) {
                                            // 거절 후 친구 요청 개수 즉시 업데이트
                                            refreshPendingCount();
                                        }
                                    } else {
                                        await deleteFriend(RequestUser.userId, userId);
                                    }
                                }}
                                className="CheckBox"
                            />

                        </div>
                    </div>
                ))
            ) : (
                // 데이터가 없을 때 빈 목록 메시지를 표시
                <div className="chatCard">
                    <span className="chatCardTitle">{title} 유저가 없습니다</span>
                </div>
            )}
        </div>
    );
}