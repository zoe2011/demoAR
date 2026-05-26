package com.demoar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 收藏路线
 */
@Data
@TableName("favorite_route")
public class FavoriteRoute {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** 路线名称 */
    private String name;

    /** 起点 "lat,lng" */
    private String origin;

    /** 终点 "lat,lng" */
    private String destination;

    /** 路线 JSON */
    private String routeData;

    private LocalDateTime createdAt;
}
