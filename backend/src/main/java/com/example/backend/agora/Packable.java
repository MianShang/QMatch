package com.example.backend.agora;

/**
 * Created by Li on 10/1/2016.
 */
public interface Packable {
    com.example.backend.agora.ByteBuf marshal(com.example.backend.agora.ByteBuf out);
}
