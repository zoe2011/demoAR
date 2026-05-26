package com.demoar.controller;

import com.demoar.dto.ApiResponse;
import com.demoar.service.TencentMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 地点搜索 Controller
 */
@RestController
@RequestMapping("/api/places")
public class PlaceController {

    @Autowired
    private TencentMapService tencentMapService;

    /**
     * 地点搜索
     * GET /api/places/search?keyword=xxx&region=北京
     */
    @GetMapping("/search")
    @SuppressWarnings("unchecked")
    public ApiResponse<Map<String, Object>> search(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "全国") String region
    ) {
        Map<String, Object> result = tencentMapService.searchPlaces(keyword, region);
        List<Map<String, Object>> data = (List<Map<String, Object>>) result.get("data");

        // 简化为前端需要的格式
        List<Map<String, Object>> places = new ArrayList<>();
        if (data != null) {
            for (Map<String, Object> item : data) {
                Map<String, Object> place = new HashMap<>();
                place.put("id", item.get("id"));
                place.put("name", item.get("title"));
                place.put("address", item.get("address"));
                Map<String, Double> location = (Map<String, Double>) item.get("location");
                if (location != null) {
                    place.put("latitude", location.get("lat"));
                    place.put("longitude", location.get("lng"));
                }
                place.put("category", item.get("category"));
                places.add(place);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("places", places);
        response.put("total", result.getOrDefault("count", places.size()));

        return ApiResponse.success(response);
    }

    /**
     * 附近 POI
     * GET /api/places/nearby?lat=xxx&lng=xxx&category=food
     */
    @GetMapping("/nearby")
    @SuppressWarnings("unchecked")
    public ApiResponse<Map<String, Object>> nearby(
        @RequestParam double lat,
        @RequestParam double lng,
        @RequestParam(required = false) String category
    ) {
        String keyword = category != null ? category : "景点";
        String region = String.format("nearby(%f,%f,1000)", lat, lng);
        Map<String, Object> result = tencentMapService.searchPlaces(keyword, region);

        List<Map<String, Object>> data = (List<Map<String, Object>>) result.get("data");
        List<Map<String, Object>> places = new ArrayList<>();
        if (data != null) {
            for (Map<String, Object> item : data) {
                Map<String, Object> place = new HashMap<>();
                place.put("id", item.get("id"));
                place.put("name", item.get("title"));
                place.put("address", item.get("address"));
                Map<String, Double> location = (Map<String, Double>) item.get("location");
                if (location != null) {
                    place.put("latitude", location.get("lat"));
                    place.put("longitude", location.get("lng"));
                }
                place.put("category", item.get("category"));
                places.add(place);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("places", places);
        return ApiResponse.success(response);
    }
}
