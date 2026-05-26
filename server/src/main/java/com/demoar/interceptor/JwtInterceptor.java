package com.demoar.interceptor;

import com.demoar.exception.BusinessException;
import com.demoar.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT 鉴权拦截器
 * 从 Authorization header 提取 Bearer token，校验后注入用户 ID 到 request attribute
 */
@Component
public class JwtInterceptor implements HandlerInterceptor {

    @Autowired
    private AuthService authService;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        // OPTIONS 预检放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException(401, "未登录");
        }

        String token = authHeader.substring(7);
        Long userId = authService.validateToken(token);
        if (userId == null) {
            throw new BusinessException(401, "登录已过期");
        }

        // 注入 userId 到 request，后续 Controller 可通过 @RequestAttribute 获取
        request.setAttribute("userId", userId);
        return true;
    }
}
