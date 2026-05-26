package com.demoar.controller;

import com.demoar.dto.ApiResponse;
import com.demoar.service.TencentMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 路线规划 Controller
 */
@RestController
@RequestMapping("/api/route")
public class RouteController {

    @Autowired
    private TencentMapService tencentMapService;

    /**
     * 步行路线规划
     * POST /api/route/plan
     * Body: { "origin": "lat,lng", "destination": "lat,lng", "mode": "walking" }
     */
    @PostMapping("/plan")
    @SuppressWarnings("unchecked")
    public ApiResponse<Map<String, Object>> planRoute(@RequestBody Map<String, String> body) {
        String origin = body.get("origin");
        String destination = body.get("destination");

        if (origin == null || destination == null) {
            return ApiResponse.fail(400, "缺少 origin 或 destination");
        }

        Map<String, Object> result = tencentMapService.planWalkingRoute(origin, destination);

        // 转换为前端友好的格式
        List<Map<String, Object>> routes = (List<Map<String, Object>>) result.get("routes");
        if (routes == null || routes.isEmpty()) {
            return ApiResponse.fail("未找到路线");
        }

        Map<String, Object> route = routes.get(0);
        Map<String, Object> simplified = new java.util.LinkedHashMap<>();
        simplified.put("distance", route.get("distance"));
        simplified.put("duration", route.get("duration"));

        // 提取路线坐标点
        Map<String, Object> polyline = (Map<String, Object>)((List<Object>)route.get("polyline")).get(0);
        simplified.put("points", polyline.get("polyline"));  // 已经是 [[lat,lng],...] 格式

        // 提取步骤
        simplified.put("steps", route.get("steps"));

        return ApiResponse.success(simplified);
    }
}
