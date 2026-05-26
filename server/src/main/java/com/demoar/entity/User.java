package com.demoar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@TableName("user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 微信 openid */
    private String openid;

    /** 微信 unionid（需绑定开放平台） */
    private String unionid;

    /** 昵称 */
    private String nickname;

    /** 头像 URL */
    private String avatarUrl;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 最后登录时间 */
    private LocalDateTime lastLoginAt;
}
