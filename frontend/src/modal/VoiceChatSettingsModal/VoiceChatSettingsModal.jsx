import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { FaMicrophone, FaHeadphones, FaVolumeUp, FaMusic } from 'react-icons/fa';
import './VoiceChatSettingsModal.css';

function VoiceChatModal({ onClose, localAudioTrack }) {
  // 장치 목록 및 선택 상태
  const [mics, setMics] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');

  // 오디오 옵션 상태
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);
  const [autoGainEnabled, setAutoGainEnabled] = useState(true);
  const [micVolume, setMicVolume] = useState(80);
  const [speakerVolume, setSpeakerVolume] = useState(80);
  const [micLevel, setMicLevel] = useState(0);
  const [audioProfile, setAudioProfile] = useState('speech_standard');

  // 초기 장치 탐색
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await AgoraRTC.getDevices(true);
        const audioMics = devices.filter((d) => d.kind === 'audioinput');
        const audioSpeakers = devices.filter((d) => d.kind === 'audiooutput');

        setMics(audioMics);
        setSpeakers(audioSpeakers);

        if (localAudioTrack) {
          const settings = localAudioTrack.getMediaStreamTrack().getSettings();
          if (settings.deviceId) setSelectedMic(settings.deviceId);
        }
      } catch (err) {
        console.error('장치 탐색 실패:', err);
      }
    };
    getDevices();
    console.log("현재 localAudioTrack:", localAudioTrack);
  }, [localAudioTrack]);

  // 실시간 마이크 감도 표시
    useEffect(() => {
    if (!localAudioTrack) return;

    const interval = setInterval(() => {
        try {
        // getVolumeLevel()은 0~1 사이 값을 반환함
        const level = localAudioTrack.getVolumeLevel() * 100;
        setMicLevel(level);
        } catch (err) {
        console.warn("마이크 감도 측정 실패:", err);
        }
    }, 100);

    return () => clearInterval(interval);
    }, [localAudioTrack]);

  // 마이크 장치 변경
  const handleMicChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedMic(deviceId);
    if (localAudioTrack) await localAudioTrack.setDevice(deviceId);
  };

  // 스피커 장치 변경
  const handleSpeakerChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedSpeaker(deviceId);
    try {
      await AgoraRTC.setPlaybackDevice(deviceId);
    } catch (err) {
      console.error('스피커 변경 실패:', err);
    }
  };

  // 소음 억제 토글
  const handleNoiseSuppressionToggle = () => {
    const next = !noiseSuppressionEnabled;
    setNoiseSuppressionEnabled(next);
    console.log('소음 억제:', next);
  };

  // 자동 음량 조절 토글
  const handleAutoGainToggle = () => {
    const next = !autoGainEnabled;
    setAutoGainEnabled(next);
    console.log('자동 음량 조절:', next);
  };

  // 마이크 볼륨 조절
  const handleMicVolumeChange = (e) => {
    const value = Number(e.target.value);
    setMicVolume(value);
    localAudioTrack?.setVolume(value);
  };

  // 스피커 볼륨 조절 (Electron 환경)
  const handleSpeakerVolumeChange = (e) => {
    const value = Number(e.target.value);
    setSpeakerVolume(value);
    try {
      AgoraRTC.setPlaybackVolume(value / 100);
    } catch (err) {
      console.warn('스피커 볼륨 조절은 Electron에서만 지원됩니다.');
    }
  };

  // 테스트 사운드 재생
  const handleTestSound = () => {
    const testAudio = new Audio('/test-sound.wav');
    testAudio.volume = speakerVolume / 100;
    testAudio.play().catch(() => {
      console.warn('테스트 사운드 재생 실패');
    });
  };

  return (
    <div className="voice-modal-overlay">
      <div className="voice-modal-content">
        {/* 헤더 */}
        <div className="modal-header">
          <h3>
            <FaVolumeUp style={{ marginRight: 8 }} />
            음성 설정
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 장치 선택 */}
        <div className="form-group">
          <label>
            <FaMicrophone style={{ marginRight: 6 }} /> 마이크
          </label>
          <select value={selectedMic} onChange={handleMicChange}>
            {mics.length ? (
              mics.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || '알 수 없는 마이크'}
                </option>
              ))
            ) : (
              <option disabled>마이크 장치가 없습니다</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label>
            <FaHeadphones style={{ marginRight: 6 }} /> 스피커
          </label>
          <select value={selectedSpeaker} onChange={handleSpeakerChange}>
            {speakers.length ? (
              speakers.map((sp) => (
                <option key={sp.deviceId} value={sp.deviceId}>
                  {sp.label || '알 수 없는 스피커'}
                </option>
              ))
            ) : (
              <option disabled>스피커 장치가 없습니다</option>
            )}
          </select>
        </div>

        {/* 마이크 감도 시각화 */}
        <div className="form-group">
          <label>마이크 입력 감도</label>
          <div className="mic-meter">
            <div
              className="mic-meter-fill"
              style={{ width: `${micLevel}%` }}
            ></div>
          </div>
        </div>

        {/* 볼륨 슬라이더 */}
        <div className="form-group">
          <label>마이크 입력 볼륨</label>
          <input
            type="range"
            min="0"
            max="100"
            value={micVolume}
            onChange={handleMicVolumeChange}
          />
        </div>

        <div className="form-group">
          <label>스피커 출력 볼륨</label>
          <input
            type="range"
            min="0"
            max="100"
            value={speakerVolume}
            onChange={handleSpeakerVolumeChange}
          />
        </div>

        {/* 오디오 옵션 */}
        <div className="form-group">
          <label>오디오 옵션</label>
          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={noiseSuppressionEnabled}
                onChange={handleNoiseSuppressionToggle}
              />
              소음 억제
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoGainEnabled}
                onChange={handleAutoGainToggle}
              />
              자동 음량 조절
            </label>
          </div>
        </div>

        {/* 테스트 버튼 */}
        <div className="form-group">
          <button onClick={handleTestSound} className="test-sound-btn">
            🔊 스피커 테스트
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceChatModal;
