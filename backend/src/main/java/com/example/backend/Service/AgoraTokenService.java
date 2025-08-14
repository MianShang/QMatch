package com.example.backend.Service;

import com.example.backend.agora.RtcTokenBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AgoraTokenService {
    @Value("${agora.app-id}")
    private String appId;

    @Value("${agora.app-certificate}")
    private String appCertificate;

    public String getToken(String channelName, String uid) {
        int expireTimestamp = (int) (System.currentTimeMillis() / 1000 + 3600);

        RtcTokenBuilder builder = new RtcTokenBuilder();

        return builder.buildTokenWithUserAccount(
                appId,                  // ✅ Agora 앱 ID
                appCertificate,         // ✅ Agora 앱 인증키
                channelName,            // ✅ 채널 이름 (ex. room_abc123)
                uid,                    // ✅ 사용자 고유 식별자 (문자열)
                RtcTokenBuilder.Role.Role_Publisher, // ✅ 권한 (호스트)
                expireTimestamp         // ✅ 만료 시간 (1시간 후)
        );
    }

}
