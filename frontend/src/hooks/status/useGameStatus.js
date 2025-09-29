import { useState, useEffect, useRef } from "react";


/**
 * 
 * @param {*} globalStomp   전역 스톰프
 * @param {*} userData      전역 유저 데이타
 * @param {*} gameTarget    Game exe 목록
 * @param {*} processes     프로세스 추출 목록
 */
export function useGameStatus(publish, subscribe, isConnected, userData, gameTarget, processes) {

    const [isRunning, setIsRunning] = useState([]); //나의 실행 상태
    const [gameStatusByUser, setGameStatusByUser] = useState([]); // 다른 유저 실행 상태
    const lastSentRef = useRef(null);

    //나의 GameStatus
    useEffect(() => {

        if (!userData?.userId || !isConnected()) return;

        const results = gameTarget.map(game => ({
            exe: game.exe,
            label: game.label,
            running: processes.some(proc => proc.name?.toLowerCase() === game.exe)
        }));

        setIsRunning(results);

        const payload = {
            userId: userData.userId,
            runningGames: results.filter(g => g.running).map(g => g.label)
        };

        if (lastSentRef.current !== JSON.stringify(payload)) {
            publish(`/app/presence/games/${userData.userId}`, payload);
            lastSentRef.current = JSON.stringify(payload);
        }
    }, [processes, userData, isConnected, publish]);

    //상대방 GameStatus
    useEffect(() => {
        if (!userData?.userId) return;

        let sub;

        (async () => {
            sub = await subscribe("/user/queue/presence/games", (frame) => {
                const payload = JSON.parse(frame.body);
                setGameStatusByUser(prev => ({
                    ...prev,
                    [payload.userId]: payload.runningGames
                }));
            });
        })();

        return () => {
            if (sub && typeof sub.unsubscribe === "function") {
                sub.unsubscribe();
            }
        };

    }, [userData?.userId, subscribe]);

    return { isRunning, gameStatusByUser };

}