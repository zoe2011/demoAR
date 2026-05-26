-- DemoAR 数据库初始化脚本

CREATE DATABASE IF NOT EXISTS demoar
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE demoar;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(64) NOT NULL UNIQUE COMMENT '微信 openid',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信 unionid',
  `nickname` VARCHAR(64) DEFAULT NULL COMMENT '昵称',
  `avatar_url` VARCHAR(512) DEFAULT NULL COMMENT '头像URL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `last_login_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后登录',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  INDEX `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 收藏地点
CREATE TABLE IF NOT EXISTS `favorite_place` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `name` VARCHAR(128) NOT NULL COMMENT '地点名称',
  `address` VARCHAR(256) DEFAULT NULL COMMENT '地址',
  `latitude` DOUBLE NOT NULL COMMENT '纬度',
  `longitude` DOUBLE NOT NULL COMMENT '经度',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` TINYINT NOT NULL DEFAULT 0,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏地点';

-- 收藏路线
CREATE TABLE IF NOT EXISTS `favorite_route` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `name` VARCHAR(128) NOT NULL COMMENT '路线名称',
  `origin` VARCHAR(64) NOT NULL COMMENT '起点 lat,lng',
  `destination` VARCHAR(64) NOT NULL COMMENT '终点 lat,lng',
  `route_data` JSON DEFAULT NULL COMMENT '路线JSON',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` TINYINT NOT NULL DEFAULT 0,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏路线';

-- 导航记录
CREATE TABLE IF NOT EXISTS `navigation_record` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `origin_name` VARCHAR(128) DEFAULT NULL COMMENT '起点名称',
  `origin` VARCHAR(64) NOT NULL COMMENT '起点坐标',
  `destination_name` VARCHAR(128) DEFAULT NULL COMMENT '终点名称',
  `destination` VARCHAR(64) NOT NULL COMMENT '终点坐标',
  `track` JSON DEFAULT NULL COMMENT '轨迹 GeoJSON',
  `distance` INT DEFAULT 0 COMMENT '总距离(米)',
  `duration` INT DEFAULT 0 COMMENT '总耗时(秒)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` TINYINT NOT NULL DEFAULT 0,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='导航记录';
