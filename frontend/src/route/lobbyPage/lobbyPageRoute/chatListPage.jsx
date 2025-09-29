import { useState, useContext, useEffect, useRef } from 'react';
import './list.css';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

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
  // VoiceChat 관련 props
  voiceSpeakers,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  localMuted,
  joinedVoice,
  voiceChatRoomId,
  voiceParticipants,
  
  globalStomp,
  onMembersPanelToggle, // 참여자 패널 상태 변경 콜백 추가
  showMembersOnly = false, // 참여자 패널만 표시하는 플래그
  membersToggle = true, // 참여자/음성채팅 토글 상태
  setMembersToggle = () => { }, // 참여자/음성채팅 토글 상태 변경 함수
  setHasUnreadMessages, // 안 읽은 메시지 상태 업데이트 함수
  // UserHistoryModal 관련 props
  isUserHistoryOpen,
  setIsUserHistoryOpen,
  historyUserId,
  setHistoryUserId,
  sendToModalGameName,
  setSendToModalGameName
}) {
  const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';
  const navigate = useNavigate();
  // State 보관함 해체
  const { userData, isRunning } = useContext(LogContext);

  // State
  const [chatListExtend, setChatListExtend] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [chatUserList, setChatUserList] = useState([]);

  // 안 읽은 메시지가 있는지 확인하고 전역 상태 업데이트
  useEffect(() => {
    const hasUnread = Object.values(unreadCounts).some(count => count > 0);
    if (setHasUnreadMessages) {
      setHasUnreadMessages(hasUnread);
    }
  }, [unreadCounts, setHasUnreadMessages]);

  const [pendingUsers, setPendingUsers] = useState([]);

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

  // 커스텀훅
  useChatGetRooms(userData, setChatList);              // 로그인한 유저의 채팅방
  useUnReadChatCount(userData, chatList, setUnreadCounts);     // 안읽은 메세지 카운트
  useNewChatNotice(userData, selectedRoom, setUnreadCounts, globalStomp);   // 새 메세지 알림

  const getChatUserList = useChatGetUserList(setChatUserList);
  const deleteUserRoom = useChatDeleteRoom();
  const getChatList = useChatListGet();
  const setRead = useSetReadUnReadChat(userData);
  const { sendRequest } = useFriendRequest();
  const { sendBlockRequest } = blockUser();

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
      const res = await fetch(`/api/chat/rooms/${roomId}?requesterUserId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("삭제 실패");
        return;
      }
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
    console.log('updateChatRoomUserCount 호출 - roomId:', roomId, 'change:', change);
    console.log('현재 chatList 구조:', chatList);

    setChatList(prev => {
      console.log('업데이트 전 chatList:', prev);
      const updated = prev.map(chat => {
        console.log('비교 중 - chat.chatRoom.id:', chat.chatRoom?.id, 'vs roomId:', roomId);
        if (chat.chatRoom?.id === roomId) {
          console.log('chatList 업데이트 - 이전 인원수:', chat.chatRoom.currentUsers, '→ 새로운 인원수:', chat.chatRoom.currentUsers + change);
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
      console.log('업데이트 후 chatList:', updated);
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
          const res = await fetch(`/api/chat/rooms/${selectedRoom.id}`);
          if (res.ok) {
            const roomData = await res.json();
            ownerId = roomData.hostUserId;
            // selectedRoom 업데이트
            setSelectedRoom(prev => prev ? { ...prev, hostUserId: ownerId } : null);
          }
        }

        if (!ownerId) {
          console.warn("방장 ID를 찾을 수 없습니다.");
          return;
        }

        const res = await fetch(`/api/chat/rooms/${selectedRoom.id}/pending-requests?ownerId=${ownerId}`);
        if (res.ok) {
          const data = await res.json();
          setPendingUsers(data.pendingRequests || []);
        }
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
    try {
      await axios.post(`/api/chat/rooms/${selectedRoom.id}/approve-join`, null, {
        params: { ownerId: selectedRoom.hostUserId, applicantId }
      });

      // 목록에서 제거
      setPendingUsers(prev => prev.filter(req => req.userId !== applicantId));
      console.log('입장 승인 완료:', applicantId);

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
    }
  };

  // 거절 함수
  const handleReject = async (applicantId) => {
    try {
      await axios.post(`/api/chat/rooms/${selectedRoom.id}/reject-join`, null, {
        params: { ownerId: selectedRoom.hostUserId, applicantId }
      });

      // 목록에서 제거
      setPendingUsers(prev => prev.filter(req => req.userId !== applicantId));
      console.log('입장 거절 완료:', applicantId);

      // 토스트 알림 표시
      toast.warning('입장을 거절했습니다.');

      // 대기자 목록 새로고침
      if (selectedRoom?.id) {
        fetchPendingRequests(selectedRoom.id, selectedRoom.hostUserId);
      }
    } catch (error) {
      console.error('입장 거절 실패:', error);
      toast.error('입장 거절에 실패했습니다.');
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
        console.log('개인 입장 신청 알림 수신:', payload);

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
        console.log('새 멤버 입장:', payload);
        console.log('selectedRoom.id:', selectedRoom?.id, 'payload.roomId:', payload.roomId);

        // 모든 채팅방 멤버에게 토스트 알림 표시
        toast.success(`${payload.userName}님이 입장했습니다!`);

        // 대기자 목록에서 제거 (입장한 사용자)
        setPendingUsers(prev => prev.filter(req => req.userId !== payload.userId));

        // 멤버 목록 새로고침 (모든 사용자)
        if (selectedRoom?.id) {
          console.log('멤버 목록 새로고침 호출:', selectedRoom.id);
          getChatUserList(selectedRoom.id);

          // 다른 이벤트와의 충돌을 방지하기 위해 약간의 지연 후 다시 새로고침
          setTimeout(() => {
            console.log('지연된 멤버 목록 새로고침 호출:', selectedRoom.id);
            getChatUserList(selectedRoom.id);
          }, 500);
        }

        // selectedRoom의 currentUsers도 업데이트
        if (selectedRoom?.id === payload.roomId) {
          console.log('currentUsers 업데이트:', selectedRoom?.id, '===', payload.roomId);
          setSelectedRoom(prev => prev ? {
            ...prev,
            currentUsers: prev.currentUsers + 1
          } : null);
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
        console.log('새 입장 신청:', payload);

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

  /* 초기 스냅샷 가져오기: 참여자 패널 오픈 + 목록 로드 시 */
  useEffect(() => {
    if (!isMembersOpen) return;
    if (!chatUserList || chatUserList.length === 0) return;

    const fetchPresenceSnapshot = async (ids) => {
      try {
        const params = new URLSearchParams();
        Array.from(new Set(ids)).forEach(id => params.append('ids', id)); // ids=a&ids=b…
        const res = await fetch(`/api/user/status/batch?` + params.toString());
        if (!res.ok) return;
        const map = await res.json(); // { userId: status }
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
              it.id !== selectedRoom.id && it.chatRoom?.id !== selectedRoom.id
            )
          );
          setUnreadCounts(prev => {
            const next = { ...prev };
            delete next[payload.roomId];
            return next;
          });
          toast.success('방장에게 의해 방에서 추방되었습니다.');
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
          console.log('join 이벤트 지연된 멤버 목록 새로고침:', roomId);
          getChatUserList(roomId);
        }, 500);

        // selectedRoom도 함께 업데이트 (현재 보고 있는 방이면)
        if (selectedRoom?.id === payload.roomId) {
          setSelectedRoom(prev => prev ? {
            ...prev,
            currentUsers: prev.currentUsers + 1
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
        console.log('방 나가기 WebSocket 이벤트 - chatList 인원수 감소');
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
        console.log("방장 변경 이벤트:", payload);

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
          fetch(`/api/chat/rooms/${roomId}`)
            .then(res => res.json())
            .then(roomData => {
              setSelectedRoom(roomData);
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
        console.log('개인 수락 알림: 메시지를 가져옵니다. roomId:', payload.roomId);
        getChatList(payload.roomId, setMessages);
        // 읽음 처리
        setRead({ id: payload.roomId });

        // 멤버 목록 새로고침
        getChatUserList(payload.roomId);

        // 해당 채팅방을 선택된 방으로 설정
        if (!selectedRoom || selectedRoom.id !== payload.roomId) {
          // 채팅방 정보를 가져와서 selectedRoom 설정
          fetch(`/api/chat/rooms/${payload.roomId}`)
            .then(res => res.json())
            .then(roomData => {
              setSelectedRoom(roomData);
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
    console.log('openMembers 호출됨:', roomId); // 디버깅용
    setIsMembersOpen(true);
    getChatUserList(roomId);
    setTimeout(measurePanel, 0);
    // 상위 컴포넌트에 참여자 패널 열림 알림
    if (onMembersPanelToggle) {
      console.log('onMembersPanelToggle 호출됨'); // 디버깅용
      onMembersPanelToggle(true);
    } else {
      console.log('onMembersPanelToggle이 없음'); // 디버깅용
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
    if (selectedRoom?.id) {
      openMembers(selectedRoom.id);
      fetchVoiceChannels(selectedRoom.id);
    }
  }, [selectedRoom?.id]);

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

  // 음성채널 목록 가져오기
  const fetchVoiceChannels = async (roomId) => {
    try {
      const res = await axios.get(`/api/voice/channels/chat-room/${roomId}`);
      if (res.status === 200) {
        setVoiceChannels(res.data);
      }
    } catch (error) {
      console.error('음성채널 목록 가져오기 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('에러 상태:', error.response?.status);
      setVoiceChannels([]);
    }
  };

  // 음성채널 생성 후 목록 업데이트
  const handleVoiceChannelCreated = (newChannel) => {
    setVoiceChannels(prev => [...prev, newChannel]);
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
                      <p>
                        {item.userId} <span className="membersDot">{getStatusIcon(eff)}</span>
                        {/* 말하는 중 표시 */}
                        {isVoiceParticipant && (
                          <span
                            className={`talkSpeakerArc ${talkingOn ? 'on' : ''}`}
                            aria-label={talkingOn ? '말하는 중' : '말하지 않음'}
                          >
                            <svg className="icon" viewBox="0 0 64 32" aria-hidden="true">
                              {/* 스피커 본체 */}
                              <path className="spk" d="M6 12v8h8l10 8V4L14 12H6z" />
                              {/* 반원 파동 3개 (오른쪽으로 퍼짐) */}
                              <path className="wave w1" d="M30 8a8 8 0 0 1 0 16" />
                              <path className="wave w2" d="M36 5a12 12 0 0 1 0 22" />
                              <path className="wave w3" d="M42 2a16 16 0 0 1 0 28" />
                            </svg>
                          </span>
                        )}
                      </p>

                      {/* VoiceChat 버튼 UI */}
                      {isMe && (
                        <div className="voice-control-panel">
                          {joinedVoice ? (
                            /* 현재 보고 있는 방과 참여 중인 방이 같은 경우 */
                            voiceChatRoomId === selectedRoom.id ? (
                              <>
                                <button onClick={onLeaveVoice}>🎧 퇴장</button>
                                <button onClick={onToggleMute}>
                                  {localMuted ? '🔊' : '🔇'}
                                </button>
                              </>
                            ) : (
                              /* 다른 방에 참여 중인 경우 */
                              <p>다른 방에 참여 중입니다.</p>
                            )
                          ) : (
                            /* 음성 채팅에 참여하고 있지 않은 경우 */
                            <button onClick={() => onJoinVoice(selectedRoom.id)}>🎙️ 입장</button>
                          )}
                        </div>
                      )}

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
                  onClick={() => {
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
                            {u.userName}
                            {isPending && ' (대기중)'}
                            <span className="membersDot">{getStatusIcon(eff)}</span>
                            {/* 실행 중인 게임 표시 */}
                            {isRunning.filter(g => g.running)
                              .map(g => (
                                <span key={g.exe} className="membersGame" style={{marginLeft:"15px", fontSize:"12px"}}>
                                  {g.label} 플레이중
                                </span>
                              ))}

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
                            {u.userName}
                            {isPending && ' (대기중)'}
                            <span className="membersDot">{getStatusIcon(eff)}</span>
                            {/* 실행 중인 게임 표시 */}
                            {isRunning.filter(g => g.running)
                              .map(g => (
                                <span key={g.exe} className="membersGame" style={{marginLeft:"15px", fontSize:"12px"}}>
                                  {g.label} 플레이중
                                </span>
                              ))}
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
                            {u.userName}
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
                              {u.userId}
                              <span className="membersDot">⚪</span>
                            </span>

                            {/* 방장만 수락/거절 버튼 표시 */}
                            {(selectedRoom?.hostUserId === userData.userId) && (
                              <div className="pending-actions">
                                <button onClick={() => handleAccept(u.userId)}>수락</button>
                                <button onClick={() => handleReject(u.userId)}>거절</button>
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

                {/* 음성채널 목록 */}
                <div className="voice-channels-list">
                  {voiceChannels.length > 0 ? (
                    voiceChannels.map((channel) => {
                      //console.log(`채널: ${channel.id}`);
                      const isJoined = joinedVoice && voiceChatRoomId === channel.id;
                      // 이 채널에 참여 중인 유저만 필터링
                      const participants = chatUserList.filter((u) => {
                        const key = String(u.userId);
                        const info = voiceSpeakers[key];
                        return info && info.voiceChannelId === channel.id;
                      });

                      return (
                        <div
                          key={channel.id}
                          className={`voice-channel-item ${isJoined ? 'joined' : ''}`}
                          onClick={() => onJoinVoice(channel.id)}
                        >
                          {/* 채널명 + 인원 수 */}
                          <div className="voice-channel-info">
                            <span className="voice-channel-name">{channel.voiceChannelName}</span>
                            <span className="voice-channel-users">
                              {participants.length}/{channel.maxUsers || '∞'}
                            </span>
                          </div>

                          {/* 참여자 목록 */}
                          {participants.length > 0 && (
                            <div className="voice-channel-participants">
                              {participants.map((u) => {
                                const key = String(u.userId);
                                const info = voiceSpeakers[key] || {};
                                const isMe = u.userId === userData.userId;
                                const talking = info.speaking && !(isMe && localMuted);

                                return (
                                  <div key={u.userId} className="voice-user-row">
                                    <span>{u.userId}</span>
                                    {talking && (
                                      <span
                                        className="talkSpeakerArc on"
                                        aria-label="말하는 중"
                                      >
                                        <svg className="icon" viewBox="0 0 64 32" aria-hidden="true">
                                          <path className="spk" d="M6 12v8h8l10 8V4L14 12H6z" />
                                          <path className="wave w1" d="M30 8a8 8 0 0 1 0 16" />
                                          <path className="wave w2" d="M36 5a12 12 0 0 1 0 22" />
                                          <path className="wave w3" d="M42 2a16 16 0 0 1 0 28" />
                                        </svg>
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-voice-channels">
                      아직 생성된 음성채널이 없습니다.
                    </div>
                  )}
                </div>

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
                      await fetch(`/api/chat/rooms/${selectedRoom.id}/kick`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          targetUserId: menu.userId,
                          requesterUserId: userData.userId
                        })
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
                      await fetch(`/api/chat/rooms/${selectedRoom.id}/transfer`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          fromUserId: userData.userId,
                          toUserId: menu.userId
                        })
                      });

                      // 즉시 UI 업데이트
                      setSelectedRoom(prev => prev ? ({
                        ...prev,
                        hostUserId: menu.userId
                      }) : null);

                      toast.success('방장을 넘겼습니다.');
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
                        await fetch(
                          // item 대신 selectedRoom을 사용
                          `/api/chat/rooms/${selectedRoom.id}/leave?userId=${userData.userId}`,
                          { method: "DELETE" }
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