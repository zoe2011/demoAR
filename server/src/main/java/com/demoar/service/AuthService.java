package com.demoar.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demoar.entity.User;
import com.demoar.exception.BusinessException;
import com.demoar.mapper.UserMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Map;

/**
 * 认证服务：微信登录 + JWT 签发/校验
 */
@Slf4j
@Service
public class AuthService {

    @Value("${wechat.miniapp.appid}")
    private String appid;

    @Value("${wechat.miniapp.secret}")
    private String secret;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Autowired
    private UserMapper userMapper;

    private final RestTemplate restTemplate = new RestTemplate();
    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(
            java.util.Base64.getEncoder().encodeToString(jwtSecret.getBytes())
        ));
    }

    /**
     * 微信登录
     * @param code wx.login() 返回的临时 code
     * @return JWT token
     */
    @SuppressWarnings("unchecked")
    public String login(String code) {
        // 1. 调用微信接口换取 openid
        String url = String.format(
            "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
            appid, secret, code
        );

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = response.getBody();

        if (body == null || body.get("errcode") != null) {
            String errMsg = body != null ? (String) body.get("errmsg") : "unknown";
            log.error("微信登录失败: {}", errMsg);
            throw new BusinessException("微信登录失败: " + errMsg);
        }

        String openid = (String) body.get("openid");
        String unionid = (String) body.get("unionid");

        // 2. 查找或创建用户
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getOpenid, openid)
        );
        if (user == null) {
            user = new User();
            user.setOpenid(openid);
            user.setUnionid(unionid);
            user.setCreatedAt(LocalDateTime.now());
            user.setLastLoginAt(LocalDateTime.now());
            userMapper.insert(user);
        } else {
            user.setLastLoginAt(LocalDateTime.now());
            userMapper.updateById(user);
        }

        // 3. 生成 JWT
        return generateToken(user.getId());
    }

    /**
     * 生成 JWT
     */
    private String generateToken(Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
            .subject(String.valueOf(userId))
            .issuedAt(now)
            .expiration(expiry)
            .signWith(signingKey)
            .compact();
    }

    /**
     * 校验 JWT，返回 userId；无效返回 null
     */
    public Long validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            return Long.parseLong(claims.getSubject());
        } catch (Exception e) {
            return null;
        }
    }
}
