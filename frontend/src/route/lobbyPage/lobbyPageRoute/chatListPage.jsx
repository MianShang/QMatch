import { useState, useContext, useEffect, useRef } from 'react';
import './list.css';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import axios from '@axios';

// 전역 유저 State 데이터 가져오기용 Context API import
import { LogContext } from '../../../App.jsx';

// Custom Hook import
import { useSetReadUnReadChat } from '../../../hooks/chatNotice/useSetReadUnReadChat.js';
import { useUnReadChatCount } from '../../../hooks/chatNotice/useUnReadChatCount.js';
import { useChatGetUserList } from '../../../hooks/chat/useChatGetUserList.js'
import { useChatDeleteRoom } from '../../../hooks/chat/useChatDeleteRoom.js'
import { useNewChatNotice } from '../../../hooks/chatNotice/useNewChatNotice.js';
import { useChatGetRooms } from '../../../hooks/chat/useChatGetRooms.js';
import { useFriendRequest } from '../../../hooks/friends/useFriendRequest.js';
import { useChatListGet } from '../../../hooks/chatList/useChatListGet.js'
import { blockUser } from '../../../hooks/friends/userBlock.js';

import ContextMenu from '../../../components/ContextMenu.jsx';

//포털
import DropdownPortal from './dropDownPotal.jsx'

// 모달 컴포넌트
import UserHistoryModal from '../../../modal/userHistory/UserHistoryModal.jsx'
import ReportModal from '../../../modal/ReportModal/ReportModal.jsx'
import CreateVoiceChannelModal from '../../../modal/CreateVoiceChannelModal/CreateVoiceChannelModal.jsx';

function ChatListPage({
  selectedRoom,
  setSelectedRoom,
  setMessages,
  onOpenProfile,
  currentUserStatus,
  onJoinVoice, // 음성채널 입장 콜백 추가
  // VoiceChat 관련 props
  voiceSpeakers,
  localMuted,
  joinedVoice,
  voiceChatRoomId,
  voiceParticipants,
  setVoiceParticipants,
  voiceChatRef,
  setVoiceChatRoomId,
  setLocalMuted,
  setJoinedVoice,

  globalStomp,
  onMembersPanelToggle, // 참여자 패널 상태 변경 콜백 추가
  showMembersOnly = false, // 참여자 패널만 표시하는 플래그
  membersToggle = true, // 참여자/음성채팅 토글 상태
  setMembersToggle = () => { }, // 참여자/음성채팅 토글 상태 변경 함수
  setHasUnreadMessages, // 안 읽은 메시지 상태 업데이트 함수
  refreshTick, // 채팅방 목록 새로고침 트리거
  // UserHistoryModal 관련 props
  isUserHistoryOpen,
  setIsUserHistoryOpen,
  historyUserId,
  setHistoryUserId,
  sendToModalGameName,
  setSendToModalGameName
}) {
  const BASE_URL = import.meta.env?.VITE_API_URL;
  const navigate = useNavigate();
  
  // State 보관함 해체
  const {
  userData,
  isRunning,
  gameStatusByUser,
  currentGroupVoiceChat,
  setCurrentGroupVoiceChat,
  friendVoiceChatActive,
  setFriendVoiceChatActive,
  currentFriendVoiceChat,
  setCurrentFriendVoiceChat,
  refreshPendingCount
} = useContext(LogContext);

  // State
  const [chatListExtend, setChatListExtend] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [chatUserList, setChatUserList] = useState([]);
  const [userNicknames, setUserNicknames] = useState({}); // userId -> userNickname 매핑

  // 안 읽은 메시지가 있는지 확인하고 전역 상태 업데이트
  useEffect(() => {
    const hasUnread = Object.values(unreadCounts).some(count => count > 0);
    if (setHasUnreadMessages) {
      setHasUnreadMessages(hasUnread);
    }
  }, [unreadCounts, setHasUnreadMessages]);

  const [pendingUsers, setPendingUsers] = useState([]);
  
  // 처리 중인 사용자들을 추적하는 상태 (중복 클릭 방지)
  const [processingUsers, setProcessingUsers] = useState(new Set());

  // chatList를 다시 로컬 state로 관리합니다.
  const [chatList, setChatList] = useState([]);

  // 포털용 전역 드롭다운 
  const [menu, setMenu] = useState(null);

  /* 참여자 패널 열림/좌표 상태 및 참조 */
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [panelRect, setPanelRect] = useState({ left: 0, top: 0, height: 0 });

  // toggle State를 기준으로 유저 상태 / 음성 컴포넌트 교체 - 기본값 true (채팅)
  const [toggle, setToggle] = useState(true);

  const leftColRef = useRef(null);

  // 실시간 프레즌스 상태 맵
  const [statusByUser, setStatusByUser] = useState({});

  // 신고 관리 모달
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // 신고할 유저 ID 저장
  const [reportedUser, setReportedUser] = useState(null);

  // 음성 채널 생성 모달
  const [showCreateVoiceChannelModal, setShowCreateVoiceChannelModal] = useState(false);
  // 음성 채널 목록
  const [voiceChannels, setVoiceChannels] = useState([]);
  const { listRefreshTick } = useContext(LogContext);
  // 우클릭
  const [rigthMenu, setRightMenu] = useState(null);

  // 커스텀훅
  useChatGetRooms(userData, setChatList);              // 로그인한 유저의 채팅방
  useUnReadChatCount(userData, chatList, setUnreadCounts);     // 안읽은 메세지 카운트
  useNewChatNotice(userData, selectedRoom, setUnreadCounts, globalStomp);   // 새 메세지 알림

  // refreshTick이 변경될 때마다 채팅방 목록 새로고침
  useEffect(() => {
    if (refreshTick > 0) {
      refreshChatList();
    }
  }, [refreshTick]);

  const getChatUserList = useChatGetUserList(setChatUserList);
  const deleteUserRoom = useChatDeleteRoom();
  const getChatList = useChatListGet();
  const setRead = useSetReadUnReadChat(userData);
  const { sendRequest } = useFriendRequest();
  const { sendBlockRequest } = blockUser();

  // 채팅방 목록 새로고침 함수
  const refreshChatList = async () => {
    if (!userData?.userId) return;
    
    try {
      const response = await axios.get('/api/get/user/chatrooms', {
        params: { userId: userData.userId }
      });
      setChatList(response.data);
    } catch (error) {
      console.error('채팅방 목록 새로고침 실패:', error);
    }
  };

  // 아이콘
  function setGameIcon(gameName) {
    switch (gameName) {
      case "overwatch": return "/gameIcons/overwatch_Icon.png";
      case "lol": return "/gameIcons/lol_Icon.png";
      case "dnf": return "/gameIcons/dnf_Icon.png";
      case "maplestory": return "/gameIcons/maplestory_Icon.png";
      case "lostark": return "/gameIcons/lostark_Icon.png";
      case "tft": return "/gameIcons/tft_Icon.png";
      default: return "https://placehold.co/45";
    }
  }

  // 상태 아이콘 매핑 함수
  function getStatusIcon(status) {
    if (status === '온라인') return '🟢';
    if (status === '자리비움') return '🟠';
    return '⚫'; // 오프라인을 검정색으로 설정 (CSS에서 회색으로 변경)
  }


  // 방 삭제
  async function handleDeleteRoom(roomId, userId) {
    const ok = await confirmToast("정말 이 방을 삭제하시겠습니까?");
    if (!ok) return; // 취소 시 그냥 return

    try {
      await axios.delete(`/api/chat/rooms/${roomId}?requesterUserId=${userId}`);
      toast.success("방이 삭제되었습니다.");
      setSelectedRoom(null);
      setMessages([]); // 메시지 목록 초기화
      setChatList((prev) =>
        prev.filter((it) => it.chatRoom.id !== roomId)
      );
    } catch (err) {
      toast.error("삭제 중 오류 발생");
    }
  }

  // 토스트 확인 메시지
  function confirmToast(message) {
    return new Promise((resolve) => {
      toast(
        <div className="confirm-toast-box">
          <p>{message}</p>
          <div className="confirm-toast-buttons">
            <button
              className="confirm-btn confirm"
              onClick={() => {
                resolve(true); // 확인
                toast.dismiss();
              }}
            >
              확인
            </button>
            <button
              className="confirm-btn cancel"
              onClick={() => {
                resolve(false); // 취소
                toast.dismiss();
              }}
            >
              취소
            </button>
          </div>
        </div>,
        { autoClose: false }
      );
    });
  }

  // 실사용 상태 계산: 내 상태는 currentUserStatus 우선, 그 외는 statusByUser 우선
  function getEffectiveStatus(u) {
    if (!u) return '오프라인';
    if (u.userId === userData?.userId && currentUserStatus) return currentUserStatus;
    return statusByUser[u.userId] ?? u.status ?? '오프라인';
  }

  /* 상태 그룹화(온라인/오프라인) - presence 값 반영, 대기 중인 사용자 제외 */
  function splitMembersByStatus(list) {
    const updatedList = list.map(u => ({ ...u, status: getEffectiveStatus(u) }));
    // 대기 중인 사용자 제외
    const activeUsers = updatedList.filter(u => u.joinStatus !== 'PENDING');
    const online = activeUsers.filter(u => u.status === '온라인');
    const away = activeUsers.filter(u => u.status === '자리비움');
    const offline = activeUsers.filter(u => u.status === '오프라인' || !u.status);
    return { online, away, offline };
  }

  /* 패널을 좌측바와 메시지창 사이에 배치 */
  function measurePanel() {
    if (!leftColRef.current) return;
    const r = leftColRef.current.getBoundingClientRect();
    // 좌측바(240px) 오른쪽에 위치하도록 설정
    setPanelRect({ left: 240, top: 0, height: r.height });
  }

  /* 패널 열릴 때/리사이즈 시 위치 재측정 */
  useEffect(() => {
    if (!isMembersOpen) return;
    measurePanel();
    const onResize = () => measurePanel();
    window.addEventListener('resize', onResize);
    const id = setInterval(measurePanel, 300);
    return () => { window.removeEventListener('resize', onResize); clearInterval(id); };
  }, [isMembersOpen]);

  // 채팅방 인원수 업데이트 함수 (chatList만 업데이트, selectedRoom은 별도 처리)
  const updateChatRoomUserCount = (roomId, change) => {
    setChatList(prev => {
      const updated = prev.map(chat => {
        if (chat.chatRoom?.id === roomId) {
          return {
            ...chat,
            chatRoom: {
              ...chat.chatRoom,
              currentUsers: Math.max(0, chat.chatRoom.currentUsers + change)
            }
          };
        }
        return chat;
      });
      return updated;
    });
  };

  // 입장 대기자 불러오기
  useEffect(() => {
    if (!selectedRoom?.id) return;

    (async () => {
      try {
        // hostUserId가 없으면 방 정보를 다시 가져와서 hostUserId 획득
        let ownerId = selectedRoom?.hostUserId;
        if (!ownerId) {
          try {
            const res = await axios.get(`/api/chat/rooms/${selectedRoom.id}`);
            const roomData = res.data;
            ownerId = roomData.hostUserId;
            // selectedRoom 업데이트
            setSelectedRoom(prev => prev ? { ...prev, hostUserId: ownerId } : null);
          } catch (err) {
            console.error("방 정보 불러오기 실패", err);
          }
        }

        if (!ownerId) {
          console.warn("방장 ID를 찾을 수 없습니다.");
          return;
        }

        const res = await axios.get(`/api/chat/rooms/${selectedRoom.id}/pending-requests?ownerId=${ownerId}`);
        setPendingUsers(res.data.pendingRequests || []);
      } catch (err) {
        console.error("대기자 목록 불러오기 실패", err);
      }
    })();
  }, [selectedRoom?.id, selectedRoom?.hostUserId]);

  // 대기자 목록 새로고침 함수
  const fetchPendingRequests = async (roomId, ownerId = null) => {
    try {
      // ownerId가 없으면 selectedRoom에서 가져오기
      const actualOwnerId = ownerId || selectedRoom?.hostUserId;
      if (!actualOwnerId) {
        console.warn("방장 ID를 찾을 수 없습니다.");
        return;
      }

      const response = await axios.get(`/api/chat/rooms/${roomId}/pending-requests`, {
        params: { ownerId: actualOwnerId }
      });
      setPendingUsers(response.data.pendingRequests || []);
    } catch (error) {
      console.error('대기자 목록 불러오기 실패:', error);
    }
  };

  // 수락 함수
  const handleAccept = async (applicantId) => {
    // 이미 처리 중인 요청인지 확인
    if (processingUsers.has(applicantId)) {
      return;
    }

    // 처리 중 상태로 설정
    setProcessingUsers(prev => new Set(prev).add(applicantId));

    try {
      await axios.post(`/api/chat/rooms/${selectedRoom.id}/approve-join`, null, {
        params: { ownerId: selectedRoom.hostUserId, applicantId }
      });

      // 목록에서 제거
      setPendingUsers(prev => prev.filter(req => req.userId !== applicantId));

      // 인원수는 WebSocket 이벤트에서 자동으로 업데이트되므로 여기서는 제거

      // 멤버 목록에 즉시 추가
      setChatUserList(prev => {
        // 이미 존재하는지 확인
        if (prev.find(u => u.userId === applicantId)) {
          return prev;
        }
        // 새 멤버 추가
        return [...prev, { userId: applicantId, status: '온라인', joinStatus: 'APPROVED' }];
      });

      // 멤버 목록 새로고침 (서버에서 최신 데이터 가져오기)
      if (selectedRoom?.id) {
        getChatUserList(selectedRoom.id);
      }
    } catch (error) {
      console.error('입장 승인 실패:', error);
      toast.error('입장 승인에 실패했습니다.');
    } finally {
      // 처리 완료 후 상태에서 제거
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicantId);
        return newSet;
      });
    }
  };

  // 거절 함수
  const handleReject = async (applicantId) => {
    // 이미 처리 중인 요청인지 확인
    if (processingUsers.has(applicantId)) {
      return;
    }

    // 처리 중 상태로 설정
    setProcessingUsers(prev => new Set(prev).add(applicantId));

    try {
      await axios.post(`/api/chat/rooms/${selectedRoom.id}/reject-join`, null, {
        params: { ownerId: selectedRoom.hostUserId, applicantId }
      });

      // 목록에서 제거
      setPendingUsers(prev => prev.filter(req => req.userId !== applicantId));

      // 토스트 알림 표시
      toast.warning('입장을 거절했습니다.');

      // 대기자 목록 새로고침
      if (selectedRoom?.id) {
        fetchPendingRequests(selectedRoom.id, selectedRoom.hostUserId);
      }
    } catch (error) {
      console.error('입장 거절 실패:', error);
      toast.error('입장 거절에 실패했습니다.');
    } finally {
      // 처리 완료 후 상태에서 제거
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicantId);
        return newSet;
      });
    }
  };

  /* 전역 프레즌스 구독자: 앱 생애주기에서 1회 연결 */
  useEffect(() => {
    if (!userData?.userId || !globalStomp) return;

    // 프레즌스 상태 구독
    globalStomp.subscribe('/topic/presence', (frame) => {
      try {
        const payload = JSON.parse(frame.body); // { userId, status, ts }
        // 실시간 반영
        setStatusByUser(prev => ({ ...prev, [payload.userId]: payload.status }));
      } catch (e) {
        console.warn('presence parse error', e);
      }
    }, { id: 'presence-status' });

    // 개인 입장 신청 알림 (방장이 채팅방에 없어도 받을 수 있음)
    globalStomp.subscribe(`/user/queue/join-request`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);

        // 방장에게만 토스트 알림 표시 (payload에서 hostUserId 확인)
        console.log('개인 알림 토스트 조건 확인:', {
          payloadHostUserId: payload.hostUserId,
          userDataUserId: userData.userId,
          isHost: payload.hostUserId === userData.userId
        });

        if (payload.hostUserId === userData.userId) {
          toast.info(`${payload.userName}님이 "${payload.roomName}" 방 입장을 신청했습니다!`);

          // 해당 채팅방이 선택된 상태라면 대기자 목록 새로고침
          if (selectedRoom?.id === payload.roomId) {
            setTimeout(() => {
              fetchPendingRequests(payload.roomId, payload.hostUserId);
            }, 1000);
          }
        }
      } catch (e) {
        console.warn('개인 입장 신청 알림 parse error', e);
      }
    }, { id: 'personal-join-request' });

    return () => {
      // 전역 구독 해제
      globalStomp.unsubscribe('presence-status');
      globalStomp.unsubscribe('personal-join-request');
    };
  }, [userData?.userId, globalStomp]);

  /* 채팅방 멤버 입장 알림 구독 업데이트 */
  useEffect(() => {
    if (!globalStomp || !selectedRoom?.id) return;

    const subscriptionId = `member-joined-${selectedRoom.id}`;

    // 멤버 입장 알림 구독
    globalStomp.subscribe(`/topic/chat/${selectedRoom.id}/member-joined`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);

        // 모든 채팅방 멤버에게 토스트 알림 표시
        toast.success(`${payload.userName}님이 입장했습니다!`);

        // 대기자 목록에서 제거 (입장한 사용자)
        setPendingUsers(prev => prev.filter(req => req.userId !== payload.userId));

        // 멤버 목록 새로고침 (즉시 + 지연 재시도)
        if (selectedRoom?.id) {
          getChatUserList(selectedRoom.id);
          setTimeout(() => getChatUserList(selectedRoom.id), 300);
          setTimeout(() => getChatUserList(selectedRoom.id), 1000);
        }

        // selectedRoom의 currentUsers도 업데이트
        if (selectedRoom?.id === payload.roomId) {
          console.log('currentUsers 업데이트:', selectedRoom?.id, '===', payload.roomId);
          setSelectedRoom(prev => prev ? {
            ...prev,
            // currentUsers: prev.currentUsers + 1
          } : null);

          // 채팅 메시지 리스트에도 즉시 입장 시스템 메시지 추가
          if (typeof setMessages === 'function') {
            setMessages(prev => ([
              ...prev,
              {
                name: "MEMBER_JOIN",
                userName: "MEMBER_JOIN",
                message: `${payload.userName}님이 입장했습니다. \n 모두 환영해주세요~~`,
                chatDate: new Date().toISOString()
              }
            ]));
          }
        } else {
          console.log('currentUsers 업데이트 안됨:', selectedRoom?.id, '!==', payload.roomId);
        }
      } catch (e) {
        console.warn('member-joined parse error', e);
      }
    }, { id: subscriptionId });

    return () => {
      globalStomp.unsubscribe(subscriptionId);
    };
  }, [selectedRoom?.id, globalStomp]);

  /* 방장에게 입장 신청 알림 구독 */
  useEffect(() => {
    if (!globalStomp || !selectedRoom?.id || !userData?.userId) return;

    const subscriptionId = `join-request-${selectedRoom.id}`;

    // 방장에게 입장 신청 알림 구독
    globalStomp.subscribe(`/topic/room/${selectedRoom.id}/join-request`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);

        // 방장에게만 토스트 알림 표시
        console.log('토스트 조건 확인:', {
          selectedRoomHostUserId: selectedRoom.hostUserId,
          userDataUserId: userData.userId,
          isHost: selectedRoom.hostUserId === userData.userId
        });

        if (selectedRoom.hostUserId === userData.userId) {
          toast.info(`${payload.userName}님이 입장을 신청했습니다!`);

          // 대기자 목록 새로고침
          setTimeout(() => {
            if (selectedRoom?.id) {
              fetchPendingRequests(selectedRoom.id, selectedRoom.hostUserId);
            }
          }, 1000);
        }
      } catch (e) {
        console.warn('join-request parse error', e);
      }
    }, { id: subscriptionId });

    return () => {
      globalStomp.unsubscribe(subscriptionId);
    };
  }, [selectedRoom?.id, userData?.userId, globalStomp]);

  /* userNickName이 null인 사용자들의 닉네임을 프로필 API로 가져오기 */
  useEffect(() => {
    if (!chatUserList || chatUserList.length === 0) return;

    const fetchMissingNicknames = async () => {
      // userNickName이 null이거나 빈 문자열인 사용자들만 필터링
      const usersNeedingNickname = chatUserList.filter(u => 
        (!u.userNickName || u.userNickName.trim() === '') && 
        !userNicknames[u.userId] // 이미 가져온 경우 제외
      );

      if (usersNeedingNickname.length === 0) return;

      // 각 사용자의 프로필 정보를 병렬로 가져오기
      const nicknamePromises = usersNeedingNickname.map(async (user) => {
        try {
          const response = await axios.get("/api/profile/user/info", {
            params: { userId: user.userId }
          });
          return {
            userId: user.userId,
            nickname: response.data.userNickname || response.data.userNickName || null
          };
        } catch (error) {
          console.error(`사용자 ${user.userId} 닉네임 가져오기 실패:`, error);
          return {
            userId: user.userId,
            nickname: null
          };
        }
      });

      const results = await Promise.all(nicknamePromises);
      const nicknameMap = {};
      results.forEach(result => {
        if (result && result.nickname) {
          nicknameMap[result.userId] = result.nickname;
        }
      });

      if (Object.keys(nicknameMap).length > 0) {
        setUserNicknames(prev => ({ ...prev, ...nicknameMap }));
      }
    };

    fetchMissingNicknames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatUserList]);

  /* 초기 스냅샷 가져오기: 참여자 패널 오픈 + 목록 로드 시 */
  useEffect(() => {
    if (!isMembersOpen) return;
    if (!chatUserList || chatUserList.length === 0) return;

    const fetchPresenceSnapshot = async (ids) => {
      try {
        const params = new URLSearchParams();
        Array.from(new Set(ids)).forEach(id => params.append('ids', id)); // ids=a&ids=b…
        const res = await axios.get(`/api/user/status/batch?` + params.toString());
        const map = res.data; // { userId: status }
        setStatusByUser(prev => ({ ...prev, ...map }));
      } catch (e) {
        // no-op
      }
    };

    const ids = chatUserList.map(u => u.userId);
    fetchPresenceSnapshot(ids);
  }, [isMembersOpen, chatUserList]);

  /* 강퇴 + 방장 변경 이벤트 (방 단위 구독) */
  useEffect(() => {
    if (!selectedRoom?.id || !userData?.userId || !globalStomp) return;

    const roomId = selectedRoom.id;

    // 강퇴 이벤트 구독
    globalStomp.subscribe(`/topic/chat/${roomId}/kick`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);

        if (payload?.targetUserId === userData.userId) {
          // 내가 추방된 경우
          setSelectedRoom(null);
          setMessages?.([]);
          setIsMembersOpen(false);
          setChatList((prev) =>
            prev.filter((it) =>
              it.chatRoom?.id !== payload.roomId
            )
          );
          setUnreadCounts(prev => {
            const next = { ...prev };
            delete next[payload.roomId];
            return next;
          });
          toast.success('방장에게 의해 방에서 추방되었습니다.');
          
          // 채팅방 목록 새로고침 (서버에서 최신 데이터 가져오기)
          setTimeout(() => {
            refreshChatList();
          }, 500);
        } else {
          // 다른 사람 추방 시 참여자 목록 갱신
          setChatUserList(prev => prev.filter(u => u.userId !== payload?.targetUserId));
          // 강퇴는 방 나가기 이벤트와 중복되므로 여기서는 인원수 업데이트하지 않음
          // (방 나가기 이벤트에서 처리됨)
        }
      } catch (e) {
        toast.error('kick payload parse error', e);
      }
    }, { id: `kick-${roomId}` });

    // join 구독
    globalStomp.subscribe(`/topic/chat/${roomId}/join`, (frame) => {
      const payload = JSON.parse(frame.body);
      if (payload.userId !== userData.userId) {
        toast.info(`${payload.userId} 님이 방에 입장했습니다.`);

        // 멤버 목록 새로고침 (더 정확한 데이터를 위해)
        getChatUserList(roomId);

        // 다른 이벤트와의 충돌을 방지하기 위해 약간의 지연 후 다시 새로고침
        setTimeout(() => {
          getChatUserList(roomId);
        }, 500);

        // selectedRoom도 함께 업데이트 (현재 보고 있는 방이면)
        if (selectedRoom?.id === payload.roomId) {
          setSelectedRoom(prev => prev ? {
            ...prev,
            // currentUsers: prev.currentUsers + 1
          } : null);
        }
      }
    }, { id: `join-${roomId}` });

    // leave 구독
    globalStomp.subscribe(`/topic/chat/${roomId}/leave`, (frame) => {
      const payload = JSON.parse(frame.body);
      if (payload.userId !== userData.userId) {
        // 다른 사람이 나간 경우 → 참여자 목록만 갱신
        toast.info(`${payload.userId} 님이 방에서 나갔습니다.`);
        setChatUserList(prev => prev.filter(u => u.userId !== payload.userId));
        // chatList의 인원수만 업데이트 (방 나간 사용자는 이미 즉시 업데이트에서 처리됨)
        updateChatRoomUserCount(payload.roomId, -1);

        // selectedRoom도 함께 업데이트 (현재 보고 있는 방이면)
        if (selectedRoom?.id === payload.roomId) {
          setSelectedRoom(prev => prev ? {
            ...prev,
            currentUsers: Math.max(0, prev.currentUsers - 1)
          } : null);
        }
      } else {
        // 내가 나간 경우 → chatList에서도 제거
        setChatList(prev => prev.filter(r =>
          r.id !== payload.roomId && r.chatRoom?.id !== payload.roomId
        ));
        setSelectedRoom(null);
        setMessages?.([]);
      }
    }, { id: `leave-${roomId}` });

    // 방장 변경 이벤트 구독
    globalStomp.subscribe(`/topic/chat/${roomId}/host-transfer`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);

        // selectedRoom의 hostUserId 업데이트
        setSelectedRoom(prev => prev ? ({
          ...prev,
          hostUserId: payload.newHost
        }) : null);

        if (payload.newHost === userData.userId) {
          toast.success("당신이 새로운 방장이 되었습니다!");
        }
        if (payload.oldHost === userData.userId) {
          toast.success("방장을 넘겼습니다.");
        }
      } catch (e) {
        console.error("host-transfer parse error", e);
      }
    }, { id: `host-transfer-${roomId}` });

    // 수락 알림 구독
    globalStomp.subscribe(`/topic/chat/${roomId}/accept`, (frame) => {
      const payload = JSON.parse(frame.body);
      toast.success(payload.message);
      setPendingUsers(prev => prev.filter(p => p.userId !== payload.userId));

      // 멤버 목록 새로고침 (더 정확한 데이터를 위해)
      getChatUserList(roomId);

      // 승인된 사용자가 현재 사용자라면 메시지 불러오기
      if (payload.userId === userData.userId) {
        getChatList(roomId, setMessages);
        // 읽음 처리
        setRead({ id: roomId });

        // 해당 채팅방을 선택된 방으로 설정
        if (!selectedRoom || selectedRoom.id !== roomId) {
          // 채팅방 정보를 가져와서 selectedRoom 설정
          axios.get(`/api/chat/rooms/${roomId}`)
            .then(res => {
              setSelectedRoom(res.data);
            })
            .catch(err => console.error('채팅방 정보 가져오기 실패:', err));
        }
      } else {
        // 다른 사용자가 승인된 경우 - currentUsers는 member-joined 이벤트에서 처리됨
        console.log('다른 사용자 승인됨:', payload.userId);
      }
    }, { id: `accept-${roomId}` });

    // 개인 수락 알림 구독
    globalStomp.subscribe(`/user/queue/accept`, (frame) => {
      const payload = JSON.parse(frame.body);
      toast.success(payload.message); // "성공적으로 입장하였습니다"

      // 채팅방에 입장했으므로 메시지 목록 불러오기
      if (payload.roomId) {
        getChatList(payload.roomId, setMessages);
        // 읽음 처리
        setRead({ id: payload.roomId });

        // 멤버 목록 새로고침
        getChatUserList(payload.roomId);

        // 해당 채팅방을 선택된 방으로 설정
        if (!selectedRoom || selectedRoom.id !== payload.roomId) {
          // 채팅방 정보를 가져와서 selectedRoom 설정
          axios.get(`/api/chat/rooms/${payload.roomId}`)
            .then(res => {
              setSelectedRoom(res.data);
            })
            .catch(err => console.error('채팅방 정보 가져오기 실패:', err));
        } else {
          // 현재 선택된 방 - currentUsers는 member-joined 이벤트에서 처리됨
          console.log('개인 수락 알림 - 현재 선택된 방:', payload.roomId);
        }
      }
    }, { id: 'personal-accept' });

    // 개인 거절 알림 구독
    globalStomp.subscribe(`/user/queue/reject`, (frame) => {
      const payload = JSON.parse(frame.body);
      toast.error(payload.message); // "방장이 입장 요청을 거절했습니다"
      setPendingUsers(prev => prev.filter(p => p.userId !== userData.userId));
    }, { id: 'personal-reject' });

    return () => {
      // 모든 구독 해제
      globalStomp.unsubscribe(`kick-${roomId}`);
      globalStomp.unsubscribe(`join-${roomId}`);
      globalStomp.unsubscribe(`leave-${roomId}`);
      globalStomp.unsubscribe(`host-transfer-${roomId}`);
      globalStomp.unsubscribe(`accept-${roomId}`);
      globalStomp.unsubscribe('personal-accept');
      globalStomp.unsubscribe('personal-reject');
    };
  }, [selectedRoom?.id, userData?.userId, globalStomp]);


  /* 열기/닫기 헬퍼 */
  function openMembers(roomId) {
    setIsMembersOpen(true);
    getChatUserList(roomId);
    // 초반 구독 타이밍 이슈로 누락될 수 있어 한번 더 새로고침
    setTimeout(() => getChatUserList(roomId), 500);
    setTimeout(measurePanel, 0);
    // 상위 컴포넌트에 참여자 패널 열림 알림
    if (onMembersPanelToggle) {
      onMembersPanelToggle(true);
    }
  }

  function closeMembers() {
    setIsMembersOpen(false);
    // 상위 컴포넌트에 참여자 패널 닫힘 알림
    if (onMembersPanelToggle) {
      onMembersPanelToggle(false);
    }
  }

  useEffect(() => {
    if (!selectedRoom?.id) return;
    (async () => {
      try {
        const res = await axios.get(`/api/voice/channels/${selectedRoom.id}`);
        if (res.status === 200) {
          console.log("새로 받은 채널 목록:", res.data);
          setVoiceChannels(res.data);
          // React 렌더링 보정 (즉시 반영 안 될 경우 대비)
          setTimeout(() => setVoiceChannels([...res.data]), 150);
        }
      } catch (error) {
        console.error("채널 목록 새로고침 실패:", error);
        setVoiceChannels([]);
      }
    })();
  }, [selectedRoom?.id, listRefreshTick]);


  // 음성 채널 생성 알림 구독
  useEffect(() => {
    if (!globalStomp || !selectedRoom?.id) return;

    const subscriptionId = `voice-channel-created-${selectedRoom.id}`;

    globalStomp.subscribe(`/topic/chat/${selectedRoom.id}/voice-channel-created`, (frame) => {
      try {
        const newChannel = JSON.parse(frame.body);
        setVoiceChannels(prev => {
          // 중복 체크: 같은 ID의 채널이 이미 있는지 확인
          const exists = prev.some(channel => channel.id === newChannel.id);
          if (exists) {
            return prev; // 이미 있으면 추가하지 않음
          }
          return [...prev, newChannel];
        });
      } catch (e) {
        console.error('음성 채널 생성 알림 파싱 실패:', e);
      }
    }, { id: subscriptionId });

    return () => {
      globalStomp.unsubscribe(subscriptionId);
    };
  }, [selectedRoom?.id, globalStomp]);

  // 공통 메뉴 열기 함수
  function openMenu(e, userId) {
    e.stopPropagation();

    // 같은 사용자의 메뉴가 이미 열려있으면 닫기
    if (menu && menu.userId === userId) {
      setMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 170;
    const gap = 8;
    setMenu({
      userId,
      gameName: selectedRoom?.gameName,
      x: Math.max(8, rect.right - menuWidth),
      y: rect.bottom + gap,
    });
  }

  // 음성채널 관련 함수들 정의
  const joinChannel = (channelId) => {
    // 실제 음성채널 입장 로직은 상위 컴포넌트에서 처리
    // 여기서는 상태만 업데이트
  };

  const leaveChannel = () => {
    // 실제 음성채널 퇴장 로직은 상위 컴포넌트에서 처리
    // 여기서는 상태만 업데이트
  };

  const toggleMute = () => {
    // 실제 음소거 토글 로직은 상위 컴포넌트에서 처리
    // 여기서는 상태만 업데이트
  };

  useEffect(() => {
    if (voiceChatRef) {
      voiceChatRef.current = {
        joinChannel,
        leaveChannel,
        toggleMute,
      };
    }
  }, [voiceChatRef]);

  // 음성채널 목록 가져오기
  const fetchVoiceChannels = async (roomId) => {
    try {
      const res = await axios.get(`/api/voice/channels/${roomId}`);
      if (res.status === 200) {
        setVoiceChannels(res.data);
      }
    } catch (error) {
      console.error('음성채널 목록 가져오기 실패:', error);
      setVoiceChannels([]);
    }
  };


  // 음성채널 생성 후 목록 업데이트
  const handleVoiceChannelCreated = (newChannel) => {
    setVoiceChannels(prev => {
      // 중복 체크: 같은 ID의 채널이 이미 있는지 확인
      const exists = prev.some(channel => channel.id === newChannel.id);
      if (exists) {
        return prev; // 이미 있으면 추가하지 않음
      }
      return [...prev, newChannel];
    });
  };


  // 음성 입장 핸들러
  const handleJoinVoice = async (channelId) => {
    // 이미 다른 채널(그룹 또는 친구 통화)에 접속 중인지 확인
    if (joinedVoice && voiceChatRoomId && voiceChatRoomId !== channelId) {
      let currentContextName = "알 수 없는 채널";

      // 현재 1:1 통화 중인 경우
      if (friendVoiceChatActive && currentFriendVoiceChat) {
        currentContextName = `${currentFriendVoiceChat.friendName}님과`;
      }
      // 현재 그룹 음성채널 중인 경우
      else if (currentGroupVoiceChat) {
        currentContextName = `${currentGroupVoiceChat.channelName} 채널에서`;
      }

      // 클릭한 대상 채널
      const targetChannel = voiceChannels.find(ch => String(ch.id) === String(channelId));
      const targetChannelName = targetChannel?.voiceChannelName || "알 수 없는 채널";

      const confirmed = await confirmToast(
        `현재 ${currentContextName} 통화 중입니다.\n${targetChannelName} 채널로 이동하시겠습니까?`
      );
      if (!confirmed) return;

      // 기존 통화 종료 (친구 또는 그룹)
      if (voiceChatRef.current) {
        await voiceChatRef.current.leaveChannel();
      }
      setJoinedVoice(false);
      setFriendVoiceChatActive(false);
      setCurrentFriendVoiceChat(null);
      await new Promise(res => setTimeout(res, 500));
    }

    // 새 그룹 음성채널 입장
    setVoiceChatRoomId(channelId);
    if (onJoinVoice) onJoinVoice(channelId);

    if (voiceChatRef?.current) {
      try {
        await voiceChatRef.current.joinChannel(channelId);
        setJoinedVoice(true);

        const targetChannel = voiceChannels.find(ch => String(ch.id) === String(channelId));
        const targetChannelName = targetChannel?.voiceChannelName || "알 수 없는 채널";

        // 전역 그룹 통화 상태 갱신
        if (selectedRoom) {
          setCurrentGroupVoiceChat({
            roomId: selectedRoom.id,
            roomName: selectedRoom.name,
            gameName: selectedRoom.gameName,
            tagNames: selectedRoom.tagNames || [],
            channelId,
            channelName: targetChannelName
          });
        }

        toast.success(`"${targetChannelName}"에 입장했습니다.`);
      } catch (error) {
        console.error("음성채널 입장 실패:", error);
        toast.error("음성채널 입장에 실패했습니다.");
      }
    } else {
      setJoinedVoice(true);
      toast.info("음성채널에 입장했습니다. (기본 모드)");
    }
  };
 

  // 음성 퇴장 핸들러
  const handleLeaveVoice = () => {
    if (voiceChatRef && voiceChatRef.current) {
      try {
        voiceChatRef.current.leaveChannel();
        setJoinedVoice(false);
        setVoiceChatRoomId(null);
        
        // 음성채널 참여자 목록 새로고침
        if (selectedRoom?.id) {
          fetchVoiceChannels(selectedRoom.id);
          
          // 지연된 새로고침 (서버 동기화용)
          setTimeout(() => {
            fetchVoiceChannels(selectedRoom.id);
          }, 1000);
        }
        
      } catch (error) {
        console.error('음성채널 퇴장 실패:', error);
        toast.error('음성채널 퇴장에 실패했습니다.');
      }
    } else {
      // voiceChatRef가 없어도 기본 동작 수행
      setJoinedVoice(false);
      setVoiceChatRoomId(null);
      toast.info('음성채널에서 퇴장했습니다. (기본 모드)');
    }
  };

  // 음소거 토글
  const handleToggleMute = () => {
    if (voiceChatRef && voiceChatRef.current) {
      try {
        voiceChatRef.current.toggleMute();
        setLocalMuted(prev => !prev);
      } catch (error) {
        console.error('음소거 토글 실패:', error);
        toast.error('음소거 토글에 실패했습니다.');
      }
    } else {
      // voiceChatRef가 없어도 기본 동작 수행
      setLocalMuted(prev => !prev);
      toast.info(`음소거가 ${localMuted ? '해제' : '설정'}되었습니다. (기본 모드)`);
    }
  };

  return (
    <>
      <div className='listRouteSize contentStyle' ref={leftColRef}>
        {/* 전적 모달 */}
        {isUserHistoryOpen && (
          <UserHistoryModal
            sendToModalGameName={sendToModalGameName}
            setUserHistoryOpen={setIsUserHistoryOpen}
            historyUserId={historyUserId}
          />
        )}
        {/* 신고 모달 */}
        {isReportModalOpen && (
          <ReportModal
            onClose={() => setIsReportModalOpen(false)}
            reporterId={userData.userId}
            reportedUserId={reportedUser}
          />
        )}

        {/* 상단: 선택한 채팅방 카드 */}
        {selectedRoom && (
          <div
            className='selectCardStyle'
            onClick={() => {
              if (isMembersOpen) {
                closeMembers();
              } else {
                openMembers(selectedRoom.id);
              }
            }}
          >
            <div className='selectCardHeaderStyle'>
              <img src={setGameIcon(selectedRoom.gameName)} alt="방 아이콘" className="chatCardImage" />
              <p>
                {selectedRoom.name}
                {typeof selectedRoom.currentUsers === 'number' && typeof selectedRoom.maxUsers === 'number' && (
                  <span style={{ marginLeft: 8, color: '#9aa0a6', fontSize: 12 }}>
                    {selectedRoom.currentUsers} / {selectedRoom.maxUsers}
                  </span>
                )}
              </p>
              <p></p>
            </div>

            {/* 더보기 클릭시 채팅방 구독한 유저 리스트 표시 */}
            {chatListExtend &&
              <div className='selectCardUserListStyle'>
                {chatUserList.map((item) => {
                  const key = String(item.userId);
                  const info = voiceSpeakers[key] || { level: 0, speaking: false };
                  const isMe = item.userId === userData.userId;

                  const isVoiceParticipant = joinedVoice && (voiceChatRoomId === selectedRoom.id);
                  const talkingOn = isVoiceParticipant && info.speaking && !(isMe && localMuted);

                  const eff = getEffectiveStatus(item);

                  return (
                    <div key={item.userId} className='UserListContentStyle'>
                       

                      {/* … 버튼 : 클릭 좌표로 포털 메뉴 오픈 
                      <div
                        className="MoreButtonStyle"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const menuWidth = 170;
                          const gap = 8;
                          setMenu({
                            userId: item.userId,
                            gameName: selectedRoom?.gameName,
                            x: Math.max(8, rect.right - menuWidth),
                            y: rect.bottom + gap,
                          });
                        }}
                      >
                        …
                      </div>*/}
                    </div>
                  );
                })}
              </div>
            }

            {/* 확장 토글
            <div onClick={() => {
              setChatListExtend(!chatListExtend);
              getChatUserList(selectedRoom.id);
            }}>
              {!chatListExtend ? <p>▼</p> : <p>▲</p>}
            </div> */}
          </div>
        )}

        {/* 하단: 저장된 채팅방 리스트 */}
        <div className="chatListScrollWrapper chatListScroll">
          {chatList
            .filter((item) => !selectedRoom || item.chatRoom.id !== selectedRoom.id)
            .map((item) => {
              const unread = unreadCounts[item.chatRoom.id] || 0;
              return (
                <div
                  key={item.id}
                  className="chatCard"
                  onClick={async () => {
                    // 채팅방 입장 전 권한 확인
                    try {
                      const response = await axios.get(`/api/chat/rooms/${item.chatRoom.id}/check-access`, {
                        params: { userId: userData.userId }
                      });
                      
                      if (!response.data.hasAccess) {
                        toast.error('이 채팅방에 접근할 권한이 없습니다.');
                        // 권한이 없는 채팅방을 목록에서 제거
                        setChatList(prev => prev.filter(chat => chat.chatRoom.id !== item.chatRoom.id));
                        // 읽지 않은 메시지 카운트도 제거
                        setUnreadCounts(prev => {
                          const next = { ...prev };
                          delete next[item.chatRoom.id];
                          return next;
                        });
                        return;
                      }
                    } catch (error) {
                      console.error('채팅방 접근 권한 확인 실패:', error);
                      toast.error('채팅방 접근 권한을 확인할 수 없습니다.');
                      return;
                    }

                    setSendToModalGameName(item.chatRoom.gameName);
                    setChatListExtend(false);
                    setUnreadCounts((prev) => ({ ...prev, [item.chatRoom.id]: 0 }));

                    // 다대다 채팅방 이동
                    navigate("/lobby", {
                      state: {
                        type: "multi",
                        roomId: item.chatRoom.id,
                        chatName: item.chatRoom.name,
                        gameName: item.chatRoom.gameName,
                        tagNames: item.chatRoom.tagNames,
                        currentUsers: item.chatRoom.currentUsers,
                        maxUsers: item.chatRoom.maxUsers,
                        hostUserId: item.chatRoom.hostUserId,
                      },
                    });

                    // 패널 토글: 열려있으면 닫고, 닫혀있으면 열기
                    if (isMembersOpen) {
                      closeMembers();
                    } else {
                      openMembers(item.chatRoom.id);
                    }
                  }}
                >
                  <div className="chatCardHeader">
                    {/* 게임 아이콘 */}
                    <img src={`${setGameIcon(item.chatRoom.gameName)}`} alt="방 아이콘" className="chatCardImage" />

                    {/* 채팅방 이름 */}
                    <span className="chatCardTitle">{item.chatRoom.name}</span>

                    {/* 안읽은 메시지가 있을 때만 별도 영역에 표시 */}
                    {unread > 0 && (
                      <div className="chatCardUnread">
                        <span className="chatCardBadge">{unread}</span>
                      </div>
                    )}

                    {/* 채팅방 나가기 */}
                    <span className="chatCardDelete">
                    </span>
                  </div>
                </div>)
            })}
        </div>
      </div>

      {/* 참여자 패널(채팅창과 채팅목록 사이에 위치) */}
      <div
        className={`membersDrawerInline ${isMembersOpen ? 'open' : ''}`}
      >
        <div className="membersDrawerHeader">
          <div onClick={() => { setToggle(true); }}
            className={`toggleSwitchText contentStyle toggleSwitch ${toggle ? 'activeBorder' : ''}`} >
            참여자
          </div>
          <div onClick={() => setToggle(false)}
            className={`toggleSwitchText contentStyle toggleSwitch ${!toggle ? 'activeBorder' : ''}`} >
            음성채팅
          </div>
        </div>

        {/* 토글 아래 내용 영역 */}
        <div className="members-content-area">
          {/* toggle이 true일 때 */}
          {toggle ? (
            <div className="membersOverlayGrouped">
              {(() => {
                const { online, away, offline } = splitMembersByStatus(chatUserList);

                // 닉네임 가져오는 헬퍼 함수
                const getUserDisplayName = (user) => {
                  // userNicknames 상태에서 먼저 확인 (프로필 API로 가져온 닉네임)
                  if (userNicknames[user.userId]) {
                    return userNicknames[user.userId];
                  }
                  
                  // userNickName (대문자 N) 우선 확인
                  if (user.userNickName && user.userNickName.trim() !== '') {
                    return user.userNickName.trim();
                  }
                  // userNickname (소문자 n) 확인
                  if (user.userNickname && user.userNickname.trim() !== '') {
                    return user.userNickname.trim();
                  }
                  // 둘 다 없으면 userName 사용
                  return user.userName || '알 수 없음';
                };

                return (
                  <>
                    {/* 온라인 */}
                    <div className="onlineMembersSectionHeader">온라인 — {online.length}</div>
                    {online.map(u => {
                      const eff = getEffectiveStatus(u);
                      const isPending = u.joinStatus === 'PENDING' && selectedRoom?.joinType !== 'free';
                      return (
                        <div className={`membersRow ${isPending ? 'membersRow--pending' : ''}`} key={'online-' + u.userId}>
                          <span className={`membersName ${isPending ? 'membersName--pending' : ''}`}>
                            {getUserDisplayName(u)}
                            {isPending && ' (대기중)'}
                            <span className="membersDot">{getStatusIcon(eff)}</span>
                            {/* 실행 중인 게임 표시 */}
                            {/* 1. 내 실행 상태 */}
                            {u.userId === userData?.userId &&
                              isRunning.filter(g => g.running).map(g => (
                                <span
                                  key={g.exe}
                                  className="membersGame"
                                  style={{ marginLeft: "15px", fontSize: "12px" }}
                                >
                                  {g.label} 플레이중
                                </span>
                              ))
                            }

                            {/* 2. 다른 유저 실행 상태 */}
                            {u.userId !== userData?.userId &&
                              gameStatusByUser[u.userId]?.map((game, idx) => (
                                <span
                                  key={idx}
                                  className="membersGame"
                                  style={{ marginLeft: "15px", fontSize: "12px" }}
                                >
                                  {game} 플레이중
                                </span>
                              ))
                            }

                          </span>
                          {/* … 버튼 : 클릭 좌표로 포털 메뉴 오픈 */}
                          <div
                            className="MoreButtonStyle"
                            onClick={(e) => openMenu(e, u.userId)}
                          >···
                          </div>
                        </div>
                      );
                    })}

                    {/* 자리비움 */}
                    <div className="awayMembersSectionHeader" style={{ marginTop: 10 }}>
                      자리비움 — {away.length}
                    </div>
                    {away.map(u => {
                      const eff = getEffectiveStatus(u);
                      const isPending = u.joinStatus === 'PENDING' && selectedRoom?.joinType !== 'free';
                      return (
                        <div className={`membersRow ${isPending ? 'membersRow--pending' : ''}`} key={'away-' + u.userId}>
                          <span className={`membersName ${isPending ? 'membersName--pending' : ''}`}>
                            {getUserDisplayName(u)}
                            {isPending && ' (대기중)'}
                            <span className="membersDot">{getStatusIcon(eff)}</span>
                            {/* 실행 중인 게임 표시 */}
                            {/* 1. 내 실행 상태 */}
                            {u.userId === userData?.userId &&
                              isRunning.filter(g => g.running).map(g => (
                                <span
                                  key={g.exe}
                                  className="membersGame"
                                  style={{ marginLeft: "15px", fontSize: "12px" }}
                                >
                                  {g.label} 플레이중
                                </span>
                              ))
                            }

                            {/* 2. 다른 유저 실행 상태 */}
                            {u.userId !== userData?.userId &&
                              gameStatusByUser[u.userId]?.map((game, idx) => (
                                <span
                                  key={idx}
                                  className="membersGame"
                                  style={{ marginLeft: "15px", fontSize: "12px" }}
                                >
                                  {game} 플레이중
                                </span>
                              ))
                            }
                          </span>
                          {/* … 버튼 : 클릭 좌표로 포털 메뉴 오픈 */}
                          <div
                            className="MoreButtonStyle"
                            onClick={(e) => openMenu(e, u.userId)}
                          >···
                          </div>
                        </div>
                      );
                    })}

                    {/* 오프라인 */}
                    <div className="offlineMembersSectionHeader" style={{ marginTop: 10 }}>
                      오프라인 — {offline.length}
                    </div>
                    {offline.map(u => {
                      const eff = getEffectiveStatus(u);
                      const isPending = u.joinStatus === 'PENDING' && selectedRoom?.joinType !== 'free';
                      return (
                        <div className={`membersRow ${isPending ? 'membersRow--pending' : ''}`} key={'off-' + u.userId}>
                          <span className={`membersName membersName--offline ${isPending ? 'membersName--pending' : ''}`}>
                            {getUserDisplayName(u)}
                            {isPending && ' (대기중)'}
                            <span className="membersDot">{getStatusIcon(eff)}</span>
                          </span>
                          {/* … 버튼 : 클릭 좌표로 포털 메뉴 오픈 */}
                          <div
                            className="MoreButtonStyle"
                            onClick={(e) => openMenu(e, u.userId)}
                          >···
                          </div>
                        </div>
                      );
                    })}
                    {selectedRoom?.joinType !== 'free' && (
                      <>
                        <div className="PendingApproval" style={{ marginTop: 10 }}>
                          수락 대기 중
                        </div>
                        {Array.isArray(pendingUsers) && pendingUsers.map(u => (
                          <div className="membersRow" key={'pending-' + u.userId}>
                            <span className="membersName membersName--offline">
                              {getUserDisplayName(u)}
                              <span className="membersDot">⚪</span>
                            </span>

                            {/* 방장만 수락/거절 버튼 표시 */}
                            {(selectedRoom?.hostUserId === userData.userId) && (
                              <div className="pending-actions">
                                <button 
                                  onClick={() => handleAccept(u.userId)}
                                  disabled={processingUsers.has(u.userId)}
                                  style={{ 
                                    opacity: processingUsers.has(u.userId) ? 0.6 : 1,
                                    cursor: processingUsers.has(u.userId) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {processingUsers.has(u.userId) ? '처리중...' : '수락'}
                                </button>
                                <button 
                                  onClick={() => handleReject(u.userId)}
                                  disabled={processingUsers.has(u.userId)}
                                  style={{ 
                                    opacity: processingUsers.has(u.userId) ? 0.6 : 1,
                                    cursor: processingUsers.has(u.userId) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {processingUsers.has(u.userId) ? '처리중...' : '거절'}
                                </button>
                              </div>
                            )}
                            <div
                              className="MoreButtonStyle"
                              onClick={(e) => openMenu(e, u.userId)}
                            >
                              …
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                  </>
                );
              })()}
            </div>
          ) : (  // toggle이 false일 때 음성채팅 UI
            <div className="membersOverlayGrouped">
              <div className="voice-chat-container" style={{ padding: '16px' }}>
                {(selectedRoom?.hostUserId === userData.userId) && (
                  <div className="create-channel-button">
                    <button onClick={() => setShowCreateVoiceChannelModal(true)}>
                      음성 채널 만들기
                    </button>
                  </div>
                )}

                {/* 음성채팅 UI */}
                <div className="voice-channels-list">
                  {voiceChannels.length > 0 ? (
                    voiceChannels.map((channel) => {
                      const participantsInChannel = (Array.isArray(voiceParticipants) ? voiceParticipants : []).filter(
                        p => p.voiceChannelId == channel.id || p.voiceChannelId === String(channel.id) || p.voiceChannelId === Number(channel.id)
                      );
                      const participantCount = participantsInChannel.length;
                      const isJoined = joinedVoice && voiceChatRoomId === channel.id;
                      
                      return (
                        <div
                          key={`voice-channel-${selectedRoom?.id}-${channel.id}`}
                          className={`voice-channel-item ${isJoined ? 'joined' : ''}`}
                          onClick={() => !isJoined && handleJoinVoice(channel.id)}
                          onContextMenu={(e) => {
                            if(selectedRoom?.hostUserId === userData.userId){
                              e.preventDefault();
                              setRightMenu({
                                x: e.clientX,
                                y: e.clientY,
                                channelId: channel.id,
                                channelName: channel.voiceChannelName,
                              });
                            }
                          }}
                        >
                          <div className="voice-channel-header">
                            <div className="voice-channel-info">
                              <span className="voice-channel-name">{channel.voiceChannelName}</span>
                              <span className="voice-channel-users">
                                {participantCount} / {channel.maxUsers || '∞'}
                              </span>
                            </div>

                            {isJoined && (
                              <div className="voice-exit-button" onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveVoice();
                              }}>
                                <button className="voice-exit-btn">퇴장</button>
                              </div>
                            )}
                          </div>

                          <div className="voice-channel-participants" key={`participants-${channel.id}-${participantCount}`}>
                            {participantCount > 0 ? (
                              participantsInChannel.map((p) => {
                                const isSpeaking = voiceSpeakers[p.userId]?.speaking;
                                return (
                                  <div 
                                    key={`${p.userId}-${channel.id}`} 
                                    className={`voice-user-row ${isSpeaking ? 'speaking' : ''}`}
                                  >
                                    <span>{p.userName}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="voice-user-row">
                                <span style={{ color: 'var(--discord-text-muted)', fontStyle: 'italic' }}>
                                  참여자가 없습니다
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-voice-channels">아직 생성된 음성채널이 없습니다.</div>
                  )}
                </div>
                {rigthMenu && (
                  <>
                  <ContextMenu
                    x={rigthMenu.x}
                    y={rigthMenu.y}
                    items={[
                      {
                        label: "채널 삭제",
                        className: "danger",
                        onClick: async () => {
                          try {
                            await axios.delete(`/api/voice/channels/delete/${rigthMenu.channelId}`);
                            setVoiceChannels((prev) =>
                              prev.filter((ch) => ch.id !== rigthMenu.channelId)
                            );
                            if (joinedVoice && voiceChatRoomId === rigthMenu.channelId) {
                              handleLeaveVoice();
                            }                            
                            toast.success(`"${rigthMenu.channelName}" 채널이 삭제되었습니다.`);
                          } catch (err) {
                            toast.error("채널 삭제 실패");
                            console.error(err);
                          } finally {
                            setRightMenu(null);
                          }
                        },
                      },
                    ]}
                    onClose={() => setRightMenu(null)}
                  />
                  </>
                )}

                {showCreateVoiceChannelModal && (
                  <CreateVoiceChannelModal
                    setShowCreateVoiceChannelModal={setShowCreateVoiceChannelModal}
                    chatRoomId={selectedRoom.id}
                    onClose={() => setShowCreateVoiceChannelModal(false)}
                    onVoiceChannelCreated={handleVoiceChannelCreated}
                    roomMaxUsers={selectedRoom?.maxUsers}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 드롭 다운을 최상단에 위치 */}
      {menu && (
        <DropdownPortal x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <div className="dropdownMenu">
            <p onClick={() => {
              onOpenProfile?.(menu.userId);
              setMenu(null);
            }}> 프로필 보기</p>

            <p onClick={() => {
              console.log('간단 스펙 보기', menu.userId);
              setSendToModalGameName(menu.gameName);
              setHistoryUserId(menu.userId);
              setIsUserHistoryOpen(true)
              setMenu(null);
            }}>
              간단 스펙 보기
            </p>

            {pendingUsers.find(u => u.userId === menu.userId) ? null : (
              <>
                {/* 강퇴 */}
                {(selectedRoom?.hostUserId === userData.userId) && (menu.userId !== userData.userId) && (
                  <p onClick={async () => {
                    try {
                      await axios.post(`/api/chat/rooms/${selectedRoom.id}/kick`, {
                        targetUserId: menu.userId,
                        requesterUserId: userData.userId
                      });

                      // 즉시 UI 업데이트 (WebSocket 이벤트와 중복 방지를 위해 selectedRoom만 업데이트)
                      setChatUserList(prev => prev.filter(u => u.userId !== menu.userId));

                      // selectedRoom의 인원수만 즉시 업데이트 (WebSocket 이벤트에서는 중복 업데이트 방지)
                      setSelectedRoom(prev => prev ? {
                        ...prev,
                        currentUsers: Math.max(0, prev.currentUsers - 1)
                      } : null);

                      toast.success('강퇴 성공:', menu.userId);
                    } catch (err) {
                      toast.error('강퇴 실패:', err);
                    }
                    setMenu(null);
                  }}>
                    강퇴하기
                  </p>
                )}

                {/* 방장 권한 넘기기 */}
                {(selectedRoom?.hostUserId === userData.userId) && (menu.userId !== userData.userId) && (
                  <p onClick={async () => {
                    try {
                      await axios.post(`/api/chat/rooms/${selectedRoom.id}/transfer`, {
                        fromUserId: userData.userId,
                        toUserId: menu.userId
                      });

                      // 즉시 UI 업데이트
                      setSelectedRoom(prev => prev ? ({
                        ...prev,
                        hostUserId: menu.userId
                      }) : null);
                    } catch (err) {
                      toast.error('방장 넘기기에 실패했습니다.');
                    }
                    setMenu(null);
                  }}>
                    방장 넘기기
                  </p>
                )}

                {/* 채팅방 나가기 */}
                {(menu.userId === userData.userId) && (selectedRoom?.hostUserId !== userData.userId) && (
                  <p
                    className="chatCardDelete"
                    onClick={async (e) => {
                      e.stopPropagation();

                      const ok = await confirmToast("정말 이 방에서 나가시겠습니까?");
                      if (!ok) return;

                      try {
                        await axios.delete(
                          `/api/chat/rooms/${selectedRoom.id}/leave?userId=${userData.userId}`
                        );

                        // 즉시 UI 업데이트
                        setChatList(prev => prev.filter(r => r.chatRoom.id !== selectedRoom.id));
                        setSelectedRoom(null);
                        setMessages([]);
                        setIsMembersOpen(false);

                        toast.success("성공적으로 나가졌습니다!");
                      } catch (err) {
                        console.error("방 나가기 실패:", err);
                        toast.error("방 나가기 실패");
                      }
                      setMenu(null);
                      closeMembers();
                    }}
                  >
                    방 나가기
                  </p>
                )}

                {/* 방 삭제 */}
                {(selectedRoom?.hostUserId === userData.userId) && (chatUserList.length === 1) && (
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(selectedRoom.id, userData.userId);
                      setMenu(null);
                      closeMembers();
                    }}
                  >
                    방 삭제
                  </p>
                )}

                {/* 친구 추가 기능 */}
                {/* 자기 자신에게는 친구 추가 메뉴가 보이지 않도록 수정 */}
                {(menu.userId !== userData.userId) && (
                  <p onClick={async () => {
                    // 훅에서 반환된 함수 호출
                    const requesterId = userData.userId;
                    const addresseeId = menu.userId;
                    const result = await sendRequest(requesterId, addresseeId);
                    if (result.success) {
                      toast.success(result.message);
                      // 친구 요청 성공 시 개수 즉시 업데이트
                      if (refreshPendingCount) {
                        refreshPendingCount();
                      }
                    }
                    else {
                      toast.error(result.message);
                    }
                    setMenu(null);
                  }}>
                    친구 추가
                  </p>
                )}

                {/* 여기는 추후에 추가 */}
                {(menu.userId !== userData.userId) && (
                  <p onClick={async () => {
                    // 훅에서 반환된 함수 호출
                    const requesterId = userData.userId;
                    const blockedId = menu.userId;
                    const result = await sendBlockRequest(requesterId, blockedId);
                    if (result.success) {
                      toast.success(result.message);
                    }
                    else {
                      toast.error(result.message);
                    }
                    setMenu(null);
                  }}>
                    차단하기
                  </p>
                )}

                {/* 신고하기 */}
                {(menu.userId !== userData.userId) && (
                  <p onClick={() => {
                    setReportedUser(menu.userId); // 신고할 유저 ID 설정
                    setIsReportModalOpen(true);   // 열고
                    setMenu(null);                // 닫아
                  }}>
                    신고하기
                  </p>
                )}
              </>
            )}
          </div>
        </DropdownPortal>
      )}
    </>
  )
}

export default ChatListPage;