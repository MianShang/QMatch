// useSpeakingIndicator.js
import { useEffect, useRef, useState } from "react";

/**
 * Agora client로부터 volume-indicator를 받아
 * 사용자별 speaking 상태와 표시용 level을 관리합니다.
 *
 * options:
 *  - threshold: 이 값 이상이면 "말하는 중"으로 간주 (0~100)
 *  - fallMs:   이 시간 동안 level이 threshold 미만이어도 "말하는 중" 유지(깜빡임 방지)
 *  - smooth:   지수이동평균(EMA) 계수 (0~1, 클수록 빠르게 반응)
 */
export function useSpeakingIndicator(client, options = {}) {
  const { threshold = 60, fallMs = 150, smooth = 1 } = options;

  const [speakers, setSpeakers] = useState(
    /** { [uid]: { level: number(0~100), speaking: boolean, lastAbove: number } } */
    {}
  );
  const stateRef = useRef(speakers);
  stateRef.current = speakers;

  useEffect(() => {
    if (!client) return;

    client.enableAudioVolumeIndicator();

    const handler = (vols) => {
      // vols: [{ uid, level }, ...]
      const next = { ...stateRef.current };
      const now = Date.now();

      vols.forEach((v) => {
        const prev = stateRef.current[v.uid] || { level: 0, speaking: false, lastAbove: 0 };

        // EMA 스무딩
        const level = Math.round(prev.level * (1 - smooth) + v.level * smooth);

        console.log(`[Agora Volume] UID: ${v.uid}, Raw Level: ${v.level}, smooth Level : ${level}`);

        let speaking = prev.speaking;
        let lastAbove = prev.lastAbove;

        if (level >= threshold) {
          speaking = true;
          lastAbove = now;
        } else {
          // 최근 lastAbove 이후 fallMs 안에는 speaking 유지(깜빡임 방지)
          speaking = now - prev.lastAbove < fallMs;
        }

        next[v.uid] = { level, speaking, lastAbove };
      });

      setSpeakers(next);
    };

    client.on("volume-indicator", handler);
    return () => {
      client.off("volume-indicator", handler);
    };
  }, [client, threshold, fallMs, smooth]);

  return speakers; // { [uid]: { level, speaking } }
}
