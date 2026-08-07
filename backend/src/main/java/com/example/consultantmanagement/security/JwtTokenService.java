package com.example.consultantmanagement.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;
    private final String secret;
    private final long expirationMinutes;

    public JwtTokenService(
            ObjectMapper objectMapper,
            @Value("${app.security.jwt-secret}") String secret,
            @Value("${app.security.jwt-expiration-minutes:120}") long expirationMinutes) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.expirationMinutes = expirationMinutes;
    }

    public String createToken(String email) {
        try {
            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", email);
            payload.put("exp", Instant.now().plusSeconds(expirationMinutes * 60).getEpochSecond());

            String unsignedToken = base64Url(objectMapper.writeValueAsBytes(header))
                    + "."
                    + base64Url(objectMapper.writeValueAsBytes(payload));

            return unsignedToken + "." + sign(unsignedToken);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create authentication token.", exception);
        }
    }

    public Optional<String> getSubject(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }

            String unsignedToken = parts[0] + "." + parts[1];
            if (!MessageDigestUtil.equals(sign(unsignedToken), parts[2])) {
                return Optional.empty();
            }

            byte[] decodedPayload = Base64.getUrlDecoder().decode(parts[1]);
            Map<String, Object> payload = objectMapper.readValue(decodedPayload, MAP_TYPE);
            Object subject = payload.get("sub");
            Object expiresAt = payload.get("exp");

            if (!(subject instanceof String email) || !(expiresAt instanceof Number expiration)) {
                return Optional.empty();
            }

            if (Instant.now().getEpochSecond() >= expiration.longValue()) {
                return Optional.empty();
            }

            return Optional.of(email);
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
        return base64Url(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }

    private String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static class MessageDigestUtil {

        static boolean equals(String left, String right) {
            byte[] leftBytes = left.getBytes(StandardCharsets.UTF_8);
            byte[] rightBytes = right.getBytes(StandardCharsets.UTF_8);

            if (leftBytes.length != rightBytes.length) {
                return false;
            }

            int result = 0;
            for (int index = 0; index < leftBytes.length; index++) {
                result |= leftBytes[index] ^ rightBytes[index];
            }
            return result == 0;
        }
    }
}

