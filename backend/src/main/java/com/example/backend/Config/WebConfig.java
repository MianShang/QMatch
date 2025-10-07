package com.example.backend.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${upload.path}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/profile/**") // 프론트 요청 경로
                .addResourceLocations("file:" + new File("uploads/profile").getAbsolutePath() + "/"); // 실제 저장 위치
        
        registry.addResourceHandler("/uploads/chat/**") // 채팅 이미지 요청 경로
                .addResourceLocations("file:" + new File("uploads/chat").getAbsolutePath() + "/"); // 실제 저장 위치
    }
}
