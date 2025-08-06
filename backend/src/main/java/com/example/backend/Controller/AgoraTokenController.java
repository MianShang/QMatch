package com.example.backend.Controller;

import com.example.backend.Dto.Request.AgoraTokenRequestDto;
import com.example.backend.Dto.Response.AgoraTokenResponseDto;
import com.example.backend.Service.AgoraTokenService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/agora")
public class AgoraTokenController {

    private final AgoraTokenService agoraTokenService;

    public AgoraTokenController(AgoraTokenService agoraTokenService) {
        this.agoraTokenService = agoraTokenService;
    }

    @PostMapping("/token")
    public AgoraTokenResponseDto getToken(@RequestBody AgoraTokenRequestDto agoraTokenRequestDto) {
        String token = agoraTokenService.getToken(agoraTokenRequestDto.getChannelName(), agoraTokenRequestDto.getUid());

        return new AgoraTokenResponseDto(token);
    }

}
