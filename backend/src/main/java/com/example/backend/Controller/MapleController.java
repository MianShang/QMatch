package com.example.backend.Controller;

import com.example.backend.Dto.MapleDto;
import com.example.backend.Service.MapleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/maple/api")
@RequiredArgsConstructor
public class MapleController {

    private final MapleService mapleService;

    @GetMapping("/character")
    public ResponseEntity<MapleDto> getCharacter(@RequestParam String name) {
        MapleDto dto = mapleService.getCharacterInfo(name);
        return ResponseEntity.ok(dto);
    }
}
