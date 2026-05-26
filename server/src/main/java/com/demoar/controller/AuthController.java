package com.demoar.controller;

import com.demoar.dto.ApiResponse;
import com.demoar.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 认证 Controller
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * 微信登录
     * POST /api/auth/login
     * Body: { "code": "wx.login()返回的code" }
     */
    @PostMapping("/login")
    public ApiResponse<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isEmpty()) {
            return ApiResponse.fail(400, "缺少 code 参数");
        }

        String token = authService.login(code);
        return ApiResponse.success(Map.of("token", token));
    }
}
