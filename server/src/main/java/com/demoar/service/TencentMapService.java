package com.demoar.service;

import com.demoar.config.TencentMapConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * 腾讯地图 API 封装
 * 
 * 代理调用腾讯地图 WebService API，不暴露 Key 给前端。
 * 文档：https://lbs.qq.com/service/webService/webServiceGuide/webServiceOverview
 */
@Slf4j
@Service
public class TencentMapService {

    @Autowired
    private TencentMapConfig config;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 步行路线规划
     * 
     * 对应腾讯地图 Direction API: /ws/direction/v1/walking
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> planWalkingRoute(String from, String to) {
        String url = UriComponentsBuilder
            .fromHttpUrl(config.getBaseUrl() + "/ws/direction/v1/walking")
            .queryParam("from", from)       // "lat,lng"
            .queryParam("to", to)           // "lat,lng"
            .queryParam("key", config.getKey())
            .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = response.getBody();

        if (body == null || !"0".equals(String.valueOf(body.get("status")))) {
            String msg = body != null ? (String) body.get("message") : "unknown";
            log.error("路线规划失败: {}", msg);
            throw new RuntimeException("路线规划失败: " + msg);
        }

        return (Map<String, Object>) body.get("result");
    }

    /**
     * 地点搜索
     * 
     * 对应腾讯地图 Place API: /ws/place/v1/search
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> searchPlaces(String keyword, String region) {
        String url = UriComponentsBuilder
            .fromHttpUrl(config.getBaseUrl() + "/ws/place/v1/search")
            .queryParam("keyword", keyword)
            .queryParam("boundary", "region(" + region + ",0)")
            .queryParam("page_size", 20)
            .queryParam("key", config.getKey())
            .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = response.getBody();

        if (body == null || !"0".equals(String.valueOf(body.get("status")))) {
            String msg = body != null ? (String) body.get("message") : "unknown";
            log.error("地点搜索失败: {}", msg);
            throw new RuntimeException("地点搜索失败: " + msg);
        }

        return body;
    }

    /**
     * 逆地理编码（坐标 → 地址）
     */
    public Map<String, Object> reverseGeocode(double lat, double lng) {
        String url = UriComponentsBuilder
            .fromHttpUrl(config.getBaseUrl() + "/ws/geocoder/v1")
            .queryParam("location", lat + "," + lng)
            .queryParam("key", config.getKey())
            .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = response.getBody();

        if (body == null || !"0".equals(String.valueOf(body.get("status")))) {
            String msg = body != null ? (String) body.get("message") : "unknown";
            throw new RuntimeException("逆地理编码失败: " + msg);
        }

        return body;
    }
}
