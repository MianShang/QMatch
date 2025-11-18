package com.example.backend.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class ImageUploadController {

    @PostMapping("/image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId
    ) {
        try {
            // 파일 유효성 검사
            if (file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "파일이 비어있습니다.");
                return ResponseEntity.badRequest().body(error);
            }

            // 이미지 파일 타입 검사
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "이미지 파일만 업로드 가능합니다.");
                return ResponseEntity.badRequest().body(error);
            }

            // 파일 크기 검사 (10MB 제한)
            if (file.getSize() > 10 * 1024 * 1024) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "파일 크기는 10MB를 초과할 수 없습니다.");
                return ResponseEntity.badRequest().body(error);
            }

            // 업로드 디렉토리 생성
            String uploadPath = new File("/app/uploads/chat").getAbsolutePath();
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // 파일명 생성 (타임스탬프 + 원본파일명)
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File dest = new File(uploadDir, fileName);
            
            // 파일 저장
            file.transferTo(dest);
            
            // 응답 데이터 생성
            Map<String, String> response = new HashMap<>();
            response.put("url", "/uploads/chat/" + fileName);
            response.put("fileName", fileName);
            response.put("originalName", file.getOriginalFilename());
            response.put("size", String.valueOf(file.getSize()));
            response.put("contentType", contentType);
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "파일 업로드 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "예상치 못한 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
