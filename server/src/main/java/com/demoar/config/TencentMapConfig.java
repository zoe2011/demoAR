package com.demoar.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 腾讯地图 API 配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "tencent.map")
public class TencentMapConfig {
    private String key;
    private String baseUrl = "https://apis.map.qq.com";
}
