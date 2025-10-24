import React, { useEffect, useState, useContext } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { FaMicrophone, FaHeadphones, FaVolumeUp } from 'react-icons/fa';
import { LogContext } from '../../App';
import './VoiceChatSettingsModal.css';

function VoiceChatModal({ onClose, localAudioTrack }) {
  const { voiceSettings, setVoiceSettings } = useContext(LogContext);

  const [mics, setMics] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [micLevel, setMicLevel] = useState(0);

  // 장치 목록 불러오기
  useEffect(() => {
    const loadDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await AgoraRTC.getDevices(true);
        setMics(devices.filter(d => d.kind === 'audioinput'));
        setSpeakers(devices.filter(d => d.kind === 'audiooutput'));
      } catch (err) {
        console.error('🎤 장치 로드 실패:', err);
      }
    };
    loadDevices();
  }, []);

  // 실시간 마이크 감도
  useEffect(() => {
    if (!localAudioTrack) return;
    const interval = setInterval(() => {
      try {
        const level = localAudioTrack.getVolumeLevel() * 100;
        setMicLevel(level);
      } catch {}
    }, 200);
    return () => clearInterval(interval);
  }, [localAudioTrack]);

  // 마이크 장치 변경
  const handleMicChange = async (e) => {
    const deviceId = e.target.value;
    setVoiceSettings(prev => ({ ...prev, inputDeviceId: deviceId }));
    try {
      if (localAudioTrack) {
        await localAudioTrack.setDevice(deviceId);
      }
      console.log(`🎤 마이크 장치 변경됨: ${deviceId}`);
    } catch (err) {
      console.error('마이크 장치 변경 실패:', err);
    }
  };

  // 스피커 장치 변경
  const handleSpeakerChange = async (e) => {
    const deviceId = e.target.value;
    setVoiceSettings(prev => ({ ...prev, outputDeviceId: deviceId }));
    try {
      const elements = document.getElementsByTagName('audio');
      for (const el of elements) {
        if (typeof el.setSinkId === 'function') {
          await el.setSinkId(deviceId);
        }
      }
      console.log(`🎧 스피커 장치 변경됨: ${deviceId}`);
    } catch (err) {
      console.warn('⚠️ 스피커 장치 변경 실패:', err);
    }
  };

  // 마이크 볼륨 변경
  const handleMicVolumeChange = (e) => {
    const value = Number(e.target.value);
    setVoiceSettings(prev => ({ ...prev, micVolume: value }));
    try {
      if (localAudioTrack) {
        localAudioTrack.setVolume(value);
      }
      console.log(`🎚️ 마이크 볼륨 설정됨: ${value}`);
    } catch (err) {
      console.warn('마이크 볼륨 변경 실패:', err);
    }
  };

  return (
    <div className="voice-modal-overlay">
      <div className="voice-modal-content">
        <div className="modal-header">
          <h3><FaVolumeUp style={{ marginRight: 8 }} /> 음성 설정</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 마이크 장치 선택 */}
        <div className="form-group">
          <label><FaMicrophone style={{ marginRight: 6 }} /> 마이크</label>
          <select value={voiceSettings.inputDeviceId} onChange={handleMicChange}>
            {mics.map(mic => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || '알 수 없는 마이크'}
              </option>
            ))}
          </select>
        </div>

        {/* 스피커 장치 선택 */}
        <div className="form-group">
          <label><FaHeadphones style={{ marginRight: 6 }} /> 스피커</label>
          <select value={voiceSettings.outputDeviceId} onChange={handleSpeakerChange}>
            {speakers.map(sp => (
              <option key={sp.deviceId} value={sp.deviceId}>
                {sp.label || '알 수 없는 스피커'}
              </option>
            ))}
          </select>
        </div>

        {/* 마이크 감도 표시 */}
        <div className="form-group">
          <label>마이크 입력 감도</label>
          <div className="mic-meter">
            <div className="mic-meter-fill" style={{ width: `${micLevel}%` }} />
          </div>
        </div>

        {/* 마이크 볼륨 슬라이더 */}
        <div className="form-group">
          <label>마이크 볼륨: {voiceSettings.micVolume}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={voiceSettings.micVolume}
            onChange={handleMicVolumeChange}
          />
        </div>

      </div>
    </div>
  );
}

export default VoiceChatModal;
