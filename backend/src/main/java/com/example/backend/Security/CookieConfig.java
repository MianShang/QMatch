package com.example.backend.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;


@Configuration
public class CookieConfig {

    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("JSESSIONID");
        serializer.setCookiePath("/");
        
        // ✅ Electron 환경 고려: HTTP 사용 시 Secure=false, SameSite=Lax 사용
        // SameSite=None은 Secure=true와 함께 사용해야 하므로 HTTP에서는 Lax 사용
        serializer.setUseSecureCookie(false);   // HTTP에서도 전송
        serializer.setSameSite("Lax");           // Electron + HTTP 환경에서 동작
        serializer.setUseHttpOnlyCookie(true);
        
        // Domain을 명시적으로 설정하지 않으면 모든 도메인에서 사용 가능
        
        return serializer;
    }

}
