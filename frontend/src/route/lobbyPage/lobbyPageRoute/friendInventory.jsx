import './list.css';
import './friendListPage.css';
import { useFriendsinventory } from '../../../hooks/friends/useFriendInventory';


export function FriendInventory({ bottomToggle, userId }) {

    // useFriendsinventory 훅의 반환값을 올바르게 비구조화 할당
    const { responseUsers, loading, error } = useFriendsinventory(userId, bottomToggle);

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
                            <span className="chatCardTitle">{RequestUser.userName}</span>
                            <button className="chatCardDelete">🗑</button>
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