package com.example.backend.Security;


import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import javax.sql.DataSource;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final DataSource dataSource; //자동로그인을 위한 의존성 주입(spring security)
    private final UserDetailsService myUserDetailsService;

    @Bean
    //토근을 DB에 저장하기 위함
    public PersistentTokenRepository tokenRepository() {
        JdbcTokenRepositoryImpl repository = new JdbcTokenRepositoryImpl();
        repository.setDataSource(dataSource);
        // schema.sql에서 테이블을 생성하므로 자동 생성 비활성화
        repository.setCreateTableOnStartup(false);
        return repository;
    }

    @Bean
    // BCrypt 인코더
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    // CORS 설정
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:5173"); // 리액트 서버
        config.addAllowedOrigin("http://localhost");      // Electron 앱 기본 주소 (개발용)

        // 필요하다면 전체 허용도 가능 (단, 보안 위험 높음)
        config.addAllowedOriginPattern("*"); // 개발 단계에서 허용

        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // csrf off
                .csrf(
                        csrf -> csrf.disable())
                .addFilterBefore(corsFilter(), UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session -> session
                        .sessionFixation(fix -> fix.changeSessionId()) //로그인 시 새로운 세션ID 발급
                        .maximumSessions(1) //동시접속 가능한 세션 수
                        .maxSessionsPreventsLogin(false) //중복 로그인 시 세션 만료
                        .sessionRegistry(sessionRegistry())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/user/**").authenticated()
                        .anyRequest().permitAll()
                )
                // 로그인 api
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/api/loginProc")
                        .defaultSuccessUrl("/loginOk", true)
                )
                //자동 로그인 설정
                .rememberMe(remember -> remember
                        .key("asdasdasddaasdaddada")
                        .rememberMeParameter("remember-me") //프론트에 보낼 파라미터 이름
                        .tokenValiditySeconds(60)  //시간 단위(초)
                        .userDetailsService(myUserDetailsService) //유저 정보를 조회 시 사용할 서비스
                        .tokenRepository(tokenRepository()) //DB 토근 저장소 연결
                        .useSecureCookie(false) //http 환경에서도 테스트
                )
                // 로그아웃 api
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

    // 세션 레지스트리 빈 등록 (세션 무효화를 위해 필요)
    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }
}