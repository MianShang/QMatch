package com.example.backend.agora;

public interface PackableEx extends com.example.backend.agora.Packable {
    void unmarshal(com.example.backend.agora.ByteBuf in);
}
