package com.demoar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 收藏地点
 */
@Data
@TableName("favorite_place")
public class FavoritePlace {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** 地点名称 */
    private String name;

    /** 地址 */
    private String address;

    /** 纬度 */
    private Double latitude;

    /** 经度 */
    private Double longitude;

    private LocalDateTime createdAt;
}
