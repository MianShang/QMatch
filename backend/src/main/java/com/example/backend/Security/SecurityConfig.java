package com.example.backend.Security;


import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.sql.DataSource;
import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final DataSource dataSource; //자동로그인을 위한 의존성 주입(spring security)
    private final UserDetailsService myUserDetailsService;

    @Value("${front_url}")
    private String front_url;

    // ✅ remember-me 토큰 저장소
    @Bean
    public PersistentTokenRepository tokenRepository() {
        JdbcTokenRepositoryImpl repository = new JdbcTokenRepositoryImpl();
        repository.setDataSource(dataSource);
        // schema.sql에서 테이블을 생성하므로 자동 생성 비활성화
        repository.setCreateTableOnStartup(false);
        return repository;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Security에 직접 연결되는 CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);

        // ✅ Electron(app://) + 개발서버 + 배포서버 모두 허용
        config.setAllowedOriginPatterns(List.of(
                "app://*",
                "null",                 // Electron이 origin:null 로 보낼 때도 허용
                "http://localhost:*",   // Vite dev
                "http://127.0.0.1:*",
                front_url               // 실제 배포 주소
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.addExposedHeader("Set-Cookie");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CORS 통합
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session -> session
                        .sessionFixation(fix -> fix.changeSessionId())
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(false)
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/user/**").authenticated()
                        .requestMatchers("/api/**").permitAll()  // ✅ API 엔드포인트 접근 허용
                        .anyRequest().permitAll()
                )

                // 로그인 설정
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/api/loginProc")
                        .successHandler((request, response, authentication) -> {
                            // Electron 환경을 위해 JSESSIONID를 응답 본문에 포함
                            HttpSession session = request.getSession();
                            String sessionId = session != null ? session.getId() : "";
                            
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"로그인 성공\",\"sessionId\":\"" + sessionId + "\"}");
                        })
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"로그인 실패\"}");
                        })
                        .permitAll()
                )

                // 자동 로그인 (remember-me)
                .rememberMe(remember -> remember
                        .key("asdasdasddaasdaddada")
                        .rememberMeParameter("remember-me")
                        .tokenValiditySeconds(60 * 60 * 24 * 7)
                        .userDetailsService(myUserDetailsService)
                        .tokenRepository(tokenRepository())
                        .useSecureCookie(false)
                )

                // 로그아웃
                .logout(logout -> logout
                        .logoutUrl("/api/logout")
                        .logoutSuccessUrl("/logoutOk")
                        .deleteCookies("JSESSIONID", "remember-me")
                );

        return http.build();
    }


    //중복 로그인 방지를 위한 세션 관리
    @Bean
    public HttpSessionEventPublisher httpSessionEventPublisher(){
        return new HttpSessionEventPublisher();
    }
}