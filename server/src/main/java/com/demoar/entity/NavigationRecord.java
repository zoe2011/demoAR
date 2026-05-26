package com.demoar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 导航记录
 */
@Data
@TableName("navigation_record")
public class NavigationRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户 ID */
    private Long userId;

    /** 起点名称 */
    private String originName;

    /** 起点坐标 "lat,lng" */
    private String origin;

    /** 终点名称 */
    private String destinationName;

    /** 终点坐标 "lat,lng" */
    private String destination;

    /** 轨迹 GeoJSON */
    private String track;

    /** 总距离（米） */
    private Integer distance;

    /** 总耗时（秒） */
    private Integer duration;

    private LocalDateTime createdAt;
}
