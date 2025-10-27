//package com.Flatery.security;
//
//import java.security.SecureRandom;
//import java.util.Base64;
//
//public class JwtSecretKeyGenerator {
//    public static void main(String[] args) {
//        byte[] key = new byte[64]; // 512-bit key
//        new SecureRandom().nextBytes(key);
//        String base64Key = Base64.getEncoder().encodeToString(key);
//        System.out.println("Base64 Encoded Secret Key:");
//        System.out.println(base64Key);
//    }
//}
