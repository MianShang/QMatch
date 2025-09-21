import React, { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import './VoiceChatModal.css';

function VoiceChatModal({ onClose, localAudioTrack }) {
    const [mics, setMics] = useState([]);
    const [speakers, setSpeakers] = useState([]);
    const [selectedMic, setSelectedMic] = useState('');
    const [selectedSpeaker, setSelectedSpeaker] = useState('');

    // 오디오 효과 상태
    const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);
    const [agcEnabled, setAgcEnabled] = useState(true);

    useEffect(() => {
        // 장치 목록을 불러와서 상태에 저장합니다.
        const getDevices = async () => {
            if (!localAudioTrack) return;

            const devices = await AgoraRTC.getDevices(true);
            const audioMics = devices.filter(d => d.kind === 'audioinput');
            const audioSpeakers = devices.filter(d => d.kind === 'audiooutput');

            setMics(audioMics);
            setSpeakers(audioSpeakers);
            
            // 현재 사용 중인 장치를 기본값으로 설정
            const currentMic = await localAudioTrack.getTrackId();
            setSelectedMic(currentMic);
        };

        getDevices();
    }, [localAudioTrack]);

    const handleMicChange = async (e) => {
        const deviceId = e.target.value;
        setSelectedMic(deviceId);
        if (localAudioTrack) {
            await localAudioTrack.setDevice(deviceId);
        }
    };

    const handleSpeakerChange = async (e) => {
        const deviceId = e.target.value;
        setSelectedSpeaker(deviceId);
        // 스피커는 AgoraRTC.setPlaybackDevice()로 제어
        AgoraRTC.setPlaybackDevice(deviceId);
    };

    const handleNoiseSuppressionToggle = async () => {
        if (localAudioTrack) {
            const nextState = !noiseSuppressionEnabled;
            setNoiseSuppressionEnabled(nextState);
            // Agora SDK의 소음 억제 API 호출
            await localAudioTrack.setNoiseSuppression(nextState);
        }
    };

    const handleAgcToggle = async () => {
        if (localAudioTrack) {
            const nextState = !agcEnabled;
            setAgcEnabled(nextState);
            // Agora SDK의 자동 이득 제어 API 호출
            await localAudioTrack.setAudioEffectParameters('auto-gain-control', nextState);
        }
    };

    return (
        <div className="voice-modal-overlay">
            <div className="voice-modal-content">
                <div className="modal-header">
                    <h3>음성 설정</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="form-group">
                    <label>마이크</label>
                    <select value={selectedMic} onChange={handleMicChange}>
                        {mics.map(mic => (
                            <option key={mic.deviceId} value={mic.deviceId}>
                                {mic.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label>스피커</label>
                    <select value={selectedSpeaker} onChange={handleSpeakerChange}>
                        {speakers.map(speaker => (
                            <option key={speaker.deviceId} value={speaker.deviceId}>
                                {speaker.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>오디오 효과</label>
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
                                checked={agcEnabled}
                                onChange={handleAgcToggle}
                            />
                            자동 이득 제어
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VoiceChatModal;