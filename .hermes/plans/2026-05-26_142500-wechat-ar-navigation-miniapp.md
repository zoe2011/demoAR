# 微信实景导航小程序 — 开发计划

> **For Hermes:** 拿到这个计划后可以逐 Phase 推进，每个 Task 建议用 subagent 独立实现。

**目标：** 开发一款基于微信生态的实景导航（AR 导航）小程序，将导航路线实时叠加在手机摄像头画面上，实现"所见即所走"的步行/骑行导航体验。

**技术栈：** 微信小程序原生框架（WXML + WXSS + TypeScript）、微信 AR 能力（Camera + Canvas 2D / WebGL）、腾讯地图 JavaScript API、**Java 后端**（Spring Boot 3 + MyBatis-Plus）。

**项目根目录：** `demoAR/`（所有开发工作在此目录下进行）

**核心假设：** 腾讯地图已覆盖目标城市；目标用户为步行者；首版不做驾车 AR（安全考量）；不做室内导航（微信不支持 BLE beacon）。

**核心交互模式：** 地图模式 ⇄ AR 模式自由切换。用户可以在地图上浏览全局路线，也可以随时切到 AR 模式，举起手机看实景——路面上出现虚拟箭头指引方向。两种模式共享同一份路线数据，切换时保持导航连续性。

---

## 产品定位

一个「把导航箭头画在真实路面上」的步行导航小程序：
- 打开即用 → 搜索目的地 → 地图上展示路线
- **地图模式：** 浏览全局路线、POI、路况，做路线决策
- **AR 模式：** 举起手机，摄像头拍到的真实道路**路面**上出现虚拟箭头，直接告诉你怎么走
  - 直行 → 路面上出现向前的箭头
  - 前方左转 → 箭头在路口向左弯曲
  - 到达终点 → 终点地面出现旗帜标记
- 两种模式一键切换，共享同一条导航路线

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           微信小程序客户端 (Frontend)                 │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Camera  │  │  Canvas  │  │  Map + RouteLogic   │  │
│  │ 组件    │  │  2D 叠加 │  │  (腾讯地图 JS SDK)  │  │
│  └────┬────┘  └────┬─────┘  └─────────┬──────────┘  │
│       │            │                  │              │
│  ┌────┴────────────┴──────────────────┴──────────┐   │
│  │         Sensor Fusion Layer (TS)              │   │
│  │  GPS + 加速度计 + 陀螺仪 + 罗盘 → 位姿估算     │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                           │
│  ┌──────────────────────┴───────────────────────┐   │
│  │         AR Renderer (Canvas 2D / WebGL)      │   │
│  │  路线箭头 / 距离标签 / POI 气泡 / 方向指引    │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS (wx.request)
┌──────────────────────┴──────────────────────────────┐
│              后端服务 (Backend — 可选)               │
│  ┌────────────┐  ┌───────────┐  ┌───────────────┐  │
│  │ 路线规划   │  │ POI 搜索  │  │ 用户数据存储  │  │
│  │ (腾讯地图  │  │ (腾讯地图 │  │ (可选功能)    │  │
│  │  方向 API) │  │  地点搜索)│  │               │  │
│  └────────────┘  └───────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

**为什么不把路线计算放客户端？** 微信小程序的 `wx.request` 域名白名单机制 + API Key 保护需要后端代理。MVP 阶段如果只做演示，可以直接用微信内置 `wx.getLocation` +本地简单计算，但不推荐上生产。

---

## Tech Stack

| 层 | 技术选型 | 理由 |
|---|---|---|
| 前端框架 | 微信原生 + TypeScript | 小程序官方推荐，社区成熟，AR 能力无框架封装 |
| AR 渲染 | Canvas 2D API (+ WebGL 渐进) | Canvas 2D 兼容性好，WebGL 用于后期 3D 箭头 |
| 地图 & 导航 | 腾讯地图 JS SDK + 路线规划 API | 微信原生地图组件使用腾讯地图数据，生态闭环 |
| 后端 | Java 21 + Spring Boot 3 + MyBatis-Plus | 企业级成熟方案，微信生态 Java SDK 完善 |
| 数据库 | MySQL 8.0 | 微信云托管原生支持，稳定可靠 |
| 缓存 | Redis（可选，MVP 可暂缓） | 路线缓存、热门 POI 缓存 |
| 部署 | 微信云托管 / 腾讯云轻量服务器 | 一站式微信生态部署，免域名备案 |

---

---

## 项目目录总览

```
demoAR/                              ← 项目根目录
├── miniprogram/                     ← 微信小程序前端
│   ├── pages/                       # 页面（index, ar-nav, route-detail, history, mine）
│   ├── components/                  # 组件（search-bar, ar-renderer, navigation-hud, poi-marker）
│   ├── utils/                       # 工具（api, sensor-filter, pose-estimator, ar-projector, geo-utils）
│   ├── services/                    # 服务封装（map-service, location-service, navigation-service）
│   ├── types/                       # TS 类型定义（route, poi, navigation）
│   └── assets/                      # 静态资源（图片, 音频）
├── server/                          ← Java 后端（Spring Boot 3 + Maven）
│   ├── pom.xml
│   └── src/main/java/com/demoar/    # controller, service, mapper, entity, dto, interceptor, config
├── docs/                            # 文档
├── .hermes/plans/                   # 开发计划
└── README.md
```

## 开发阶段 (Phases)

### Phase 0：环境准备与项目脚手架 (Day 1)

| # | 任务 | 产出 |
|---|---|---|
| 0.1 | 注册微信小程序账号（个人/企业），获取 AppID | AppID |
| 0.2 | 安装微信开发者工具，创建项目骨架 | 空项目跑通 |
| 0.3 | 初始化 TypeScript + ESLint + Prettier | tsconfig.json, .eslintrc |
| 0.4 | 配置小程序基本结构：pages 分包、utils/、components/ | 目录结构 |
| 0.5 | 腾讯地图 API Key 申请 + 域名白名单配置 | Key, 白名单 |
| 0.6 | 搭建 Java 后端项目骨架（Spring Boot 3 + Maven），跑通 Hello World + 集成 MyBatis-Plus | 后端空服务 |
| 0.7 | 配置 MySQL 数据库 + 初始化表结构（用户、路线、POI） | 数据库就绪 |

### Phase 1：地图基础 + 路线规划 (Day 2-4)

| # | 任务 | 描述 |
|---|---|---|
| 1.1 | 首页 UI：搜索框 + 当前位置显示 + 地图组件 | `pages/index/index` |
| 1.2 | 地点搜索（腾讯地图地点搜索 API，通过后端代理） | 搜索建议列表 |
| 1.3 | 路线规划：步行/骑行模式切换，调用路线规划 API | 路线 JSON → Polyline |
| 1.4 | 地图上绘制路线（`map` 组件 + `polyline`）+ 起终点标记 | 路线可视化 |
| 1.5 | 路线详情：距离、预计时间、步骤列表 | `pages/route-detail/` |
| 1.6 | 定位权限请求 + 地图跟随用户位置（`wx.getLocation`） | 实时蓝点 |

**Phase 1 验收标准：** 搜索目的地 → 看到路线 → 地图上显示完整路径。

### Phase 2：AR 核心引擎 — 路面箭头渲染 (Day 5-12) ⭐ 核心难点

这是项目的技术心脏：**把导航箭头"贴"在摄像头拍到的真实路面上**。

核心问题：已知用户 GPS 坐标 + 手机朝向 + 路线每个拐点的 GPS 坐标 → 如何算出箭头在屏幕上的位置和透视变形？

```
                                   ┌─────────────────────┐
                                   │   屏幕最终效果       │
                                   │  🏢🏢🏢🏢🏢🏢🏢     │
                                   │  🏢  [←]   🏢      │  ← [←] 是画在路面上的左转箭头
                                   │  🏢   🛣️🛣️    🏢    │
                                   │  🏢🏢🏢🏢🏢🏢🏢     │
                                   └─────────────────────┘
```

**投影流程：**

```
GPS 路线点 (lat,lng)
    │
    ▼  转 ENU 坐标系（以用户位置为原点）
ENU 3D 坐标 (east, north, up)
    │
    ▼  假设路面为水平面 (up=0)，路线点投影到路面平面
路平面 3D 点
    │
    ▼  相机外参（位置+朝向）→ 变换到相机坐标系
相机坐标系 3D 点
    │
    ▼  内参矩阵（FOV + 屏幕尺寸）→ 透视投影
屏幕 2D 坐标 (x, y)
    │
    ▼  Canvas 绘制（带透视的箭头/纹理）
屏幕上的路面箭头
```

**路面平面假设：** 由于微信小程序无法做视觉 SLAM，我们假设路面是水平的，高度 = 用户设备高度 - 1.5m（人眼/手持高度）。这个假设在步行场景基本成立。

| # | 任务 | 描述 |
|---|---|---|
| 2.1 | 创建 AR 导航页 `pages/ar-nav/`：全屏 `<camera>` + 覆盖 `<canvas type="2d">` | WXML 骨架 |
| 2.2 | 坐标系工具：GPS→ENU 转换（Haversine/平面近似），ENU→相机坐标 | `utils/geo-utils.ts` |
| 2.3 | 传感器数据采集：`wx.onAccelerometerChange` + `wx.onCompassChange` + `wx.onGyroscopeChange` | 加速度 + 方位角 + 角速度 |
| 2.4 | 互补滤波 / 卡尔曼滤波融合传感器（加速度计去噪声 + 陀螺仪短期姿态 + 罗盘长期修正） | `utils/sensor-filter.ts` |
| 2.5 | 从滤波后的传感器数据计算相机外参：位置(GPS) + 旋转矩阵(俯仰/偏航/滚转) | `utils/pose-estimator.ts` |
| 2.6 | 相机内参矩阵：根据设备 FOV 和屏幕分辨率构建投影矩阵 | `utils/camera-intrinsics.ts` |
| 2.7 | 完整的投影流水线：路线点(ENU) → 相机坐标 → 屏幕坐标 | `utils/ar-projector.ts` |
| 2.8 | 路线点采样 + 可见性裁剪：只渲染相机前方 ±45° 视野内的路段 | 裁剪优化 |
| 2.9 | **路面箭头绘制：** 从屏幕坐标列表中，在 Canvas 上绘制方向箭头（箭头跟随路线方向旋转，近大远小透视） | Canvas 箭头渲染 |
| 2.10 | 距离标签：箭头旁边显示 "xxx米"，字体大小随距离缩放 | 距离标注 |
| 2.11 | 到达路口时的特效：箭头变粗/颜色变化 + 精确方向指示（左转 30° vs 右转 45°） | 方向精细化 |
| 2.12 | 无目标 AR 探索：扫描周围时标注附近 POI（基于方位角投影） | POI AR 标注 |
| 2.13 | 性能优化：requestAnimationFrame 30fps，脏矩形检测，远离的箭头降低刷新 | 性能调优 |
| 2.14 | 模式切换动画：地图模式 ↔ AR 模式过渡（Camera 渐显 + Canvas 动画） | 切换过渡 |

**Phase 2 验收标准：**
- 举起手机 → 路面出现箭头 → 顺箭头方向走到路口 → 箭头确实在路口指向正确方向
- 转身 90° → 箭头在画面上随之移动（而非固定）
- 走近箭头 → 箭头变大（近大远小透视）
- 3 条以上真实路线的实景测试通过

### Phase 3：导航体验完善 (Day 11-14)

| # | 任务 | 描述 |
|---|---|---|
| 3.1 | 语音播报（`wx.createInnerAudioContext` + TTS 或预录音频） | 语音导航 |
| 3.2 | 偏航检测 + 重新规划路线 | 偏航重算 |
| 3.3 | 到达目的地检测 + 结束动画 | 到达提示 |
| 3.4 | 夜间模式：Canvas 颜色切换 + 屏幕亮度调节 | 夜间 UI |
| 3.5 | 电量优化：非导航时降低传感器采样率 | 省电策略 |
| 3.6 | 后台定位（`wx.startLocationUpdateBackground`）+ 锁屏导航 | 后台导航 |
| 3.7 | 导航记录存储（轨迹、距离、时间）→ 历史页面 | 历史记录 |
| 3.8 | UI 打磨：导航页 HUD 布局、方向罗盘、速度显示 | HUD |

### Phase 4：后端完整化 (Day 15-17)

| # | 任务 | 描述 |
|---|---|---|
| 4.1 | 路线规划 Controller + Service：封装腾讯地图 Direction API | `POST /api/route/plan` |
| 4.2 | 地点搜索 + 附近 POI：封装腾讯地图 Place Search API | `GET /api/places/search`, `GET /api/places/nearby` |
| 4.3 | 反向地理编码（坐标 → 地址） | `GET /api/geocode/reverse` |
| 4.4 | 微信登录：`wx.login` 获取 code → 后端换取 openid + 生成 JWT | `POST /api/auth/login` |
| 4.5 | 用户信息存储（MyBatis-Plus 实体 + 自动建表） | `user` 表 + CRUD |
| 4.6 | 收藏地点 / 常用路线（关联用户 ID） | `favorite_place` / `favorite_route` 表 |
| 4.7 | 导航历史记录（`navigation_record` 表：轨迹 GeoJSON、距离、耗时） | 历史 CURD |
| 4.8 | 接口鉴权：JWT 拦截器（Spring Interceptor）+ 全局异常处理 | 鉴权中间件 |
| 4.9 | 访问频率限制（Guava RateLimiter 或自定义注解） | Rate limit |
| 4.10 | API Key 安全：腾讯地图 Key 放在 `application.yml`，不暴露给前端 | 安全 |

### Phase 5：测试与发布 (Day 18-21)

| # | 任务 | 描述 |
|---|---|---|
| 5.1 | 单元测试：AR 投影算法、传感器滤波 | Jest / Vitest |
| 5.2 | 集成测试：后端 API + 前端页面 E2E（miniprogram-automator） | E2E |
| 5.3 | 多机型适配测试（iOS / Android，不同屏幕比例） | 兼容性 |
| 5.4 | 性能测试：FPS 监测、内存泄漏排查 | 性能 |
| 5.5 | 实景路测：3 条以上真实路线，白天/夜间各走一遍 | 实地验证 |
| 5.6 | 代码审核准备：隐私合规（位置权限说明）、内容安全 | 审核清单 |
| 5.7 | 提交微信审核 + 灰度发布 | 上线 |

---

## 目录结构 (前端)

```
miniprogram/
├── app.ts                          # 入口，全局生命周期
├── app.json                        # 页面路由、窗口配置、权限声明
├── app.wxss                        # 全局样式
├── project.config.json             # 开发者工具配置
├── tsconfig.json
├── pages/
│   ├── index/                      # 首页（搜索 + 地图）
│   │   ├── index.ts
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   └── index.json
│   ├── ar-nav/                     # AR 导航页（核心页面）
│   │   ├── ar-nav.ts
│   │   ├── ar-nav.wxml             # camera + canvas 叠加
│   │   ├── ar-nav.wxss
│   │   └── ar-nav.json
│   ├── route-detail/               # 路线详情
│   ├── history/                    # 导航历史
│   └── mine/                       # 个人中心
├── components/
│   ├── search-bar/                 # 搜索输入组件
│   ├── ar-renderer/                # AR 渲染引擎组件
│   ├── navigation-hud/             # HUD 信息叠加组件
│   ├── poi-marker/                 # AR POI 标注
│   └── voice-guide/                # 语音播报组件
├── utils/
│   ├── api.ts                      # wx.request 封装
│   ├── sensor-filter.ts            # 传感器滤波（低通/卡尔曼）
│   ├── pose-estimator.ts           # 位姿估算
│   ├── ar-projector.ts             # 3D→2D 投影
│   ├── route-calculator.ts         # 路线计算与缓存
│   └── geo-utils.ts                # 地理工具函数
├── services/
│   ├── map-service.ts              # 腾讯地图 SDK 封装
│   ├── location-service.ts         # 定位服务封装
│   └── navigation-service.ts       # 导航状态机
├── types/
│   ├── route.d.ts                  # 路线类型定义
│   ├── poi.d.ts                    # POI 类型
│   └── navigation.d.ts             # 导航状态类型
└── assets/
    ├── images/
    └── audio/                      # 预录导航语音
```

## 目录结构 (后端 — Spring Boot)

```
server/
├── pom.xml                                    # Maven 配置（spring-boot-starter-web, mybatis-plus, mysql-connector, jjwt, lombok）
├── src/
│   ├── main/
│   │   ├── java/com/demoar/
│   │   │   ├── DemoArApplication.java         # Spring Boot 启动类
│   │   │   ├── config/
│   │   │   │   ├── WebMvcConfig.java          # CORS + 拦截器注册
│   │   │   │   └── TencentMapConfig.java      # 腾讯地图 API Key 配置
│   │   │   ├── controller/
│   │   │   │   ├── RouteController.java       # 路线规划接口
│   │   │   │   ├── PlaceController.java       # POI 搜索接口
│   │   │   │   ├── AuthController.java        # 微信登录接口
│   │   │   │   └── UserController.java        # 用户/收藏/历史接口
│   │   │   ├── service/
│   │   │   │   ├── TencentMapService.java      # 腾讯地图 API 调用封装
│   │   │   │   ├── RouteService.java           # 路线规划业务
│   │   │   │   ├── AuthService.java            # 登录 + JWT 签发
│   │   │   │   └── UserService.java            # 用户/收藏/历史业务
│   │   │   ├── mapper/
│   │   │   │   ├── UserMapper.java             # MyBatis-Plus BaseMapper
│   │   │   │   ├── FavoritePlaceMapper.java
│   │   │   │   ├── FavoriteRouteMapper.java
│   │   │   │   └── NavigationRecordMapper.java
│   │   │   ├── entity/
│   │   │   │   ├── User.java
│   │   │   │   ├── FavoritePlace.java
│   │   │   │   ├── FavoriteRoute.java
│   │   │   │   └── NavigationRecord.java
│   │   │   ├── dto/                            # 请求/响应 DTO
│   │   │   │   ├── RoutePlanRequest.java
│   │   │   │   ├── LoginRequest.java
│   │   │   │   └── ApiResponse.java            # 统一响应体 `{code, msg, data}`
│   │   │   ├── interceptor/
│   │   │   │   └── JwtInterceptor.java         # JWT 校验拦截器
│   │   │   └── exception/
│   │   │       ├── GlobalExceptionHandler.java # @ControllerAdvice
│   │   │       └── BusinessException.java
│   │   └── resources/
│   │       ├── application.yml                 # 主配置（DB, 腾讯 Key, JWT secret）
│   │       └── db/
│   │           └── schema.sql                  # 建表 SQL
│   └── test/
│       └── java/com/demoar/
│           ├── controller/                      # Controller 集成测试
│           └── service/                         # Service 单元测试
```

---

## 关键技术难点与对策

### 1. 路面箭头投影精度（最大技术风险）

**问题：** 要把箭头精确地"贴"在真实路面上，需要同时满足：
- GPS 精度（5-20m 误差）→ 箭头可能在隔壁车道
- 罗盘方向误差（±5°~15°）→ 箭头可能偏到马路对面的楼上
- 手机俯仰角不准 → 箭头该近的地方远了、该远的地方近了

**分层对策：**

| 层级 | 方案 | 效果 |
|---|---|---|
| **基础层** | 路面水平面假设 + GPS + 罗盘 + 互补滤波 | 城市开阔地带可用（误差 ~3-8m） |
| **增强层** | 陀螺仪积分短期姿态 + 罗盘长期修正（卡尔曼） | 方向更平滑，转弯时箭头不抖 |
| **兜底层** | 当传感器剧烈抖动时自动切换到半 AR 模式（路面箭头淡化 + 顶部 HUD 方向指示出现） | 保证导航不中断 |

**具体调优策略：**
- 罗盘校准提示：检测到磁场异常时弹窗提示用户"画 8 字"校准
- 方向平滑：罗盘读数做 1 秒滑动窗口平均，抑制抖动的指向
- 路面网格辅助：在 Canvas 上绘制半透明网格线帮助用户感知"箭头确实在地面上"，增强沉浸感降低精度要求感知
- 路口放大：距离路口 20 米时箭头自动变粗 + 增加提示文字，弥补定位误差

### 2. 罗盘可用性

**问题：** 微信小程序在某些 Android 设备上罗盘数据不稳定，室内/地库/高楼间磁场干扰大。

**对策：**
- 使用陀螺仪做短期方向积分（1-3 秒），罗盘做长期修正
- 检测罗盘异常时显示"方向校准中"提示
- `wx.startCompass` 前检查 `wx.stopCompass` 是否支持（部分低版本不支持）

### 3. 性能与发热

**对策：**
- Canvas 渲染模式时使用 `requestAnimationFrame`，30fps 而非 60fps
- 传感器采样频率动态降级（静止时低频，转动时高频）
- 在非导航状态使用地图模式而非 AR 模式

### 4. 夜间模式适配

**问题：** 夜间 AR 叠加如果颜色太亮会刺眼。

**对策：**
- 检测环境光（通过摄像头画面平均亮度），自动切换暗色/亮色主题
- 导航箭头降低透明度 + 增加对比度

### 5. 微信审核

**问题：** AR 导航不属于微信小程序的"常规分类"，审核可能更严格。

**对策：**
- 确保位置权限申请的"使用场景说明"充分合理
- 首次打开不做强制授权，提供"先体验地图"的降级路径
- 不收集非必要用户数据，隐私政策清晰

---

## 时间线估算

| Phase | 内容 | 预估工时 | 依赖 |
|---|---|---|---|
| Phase 0 | 环境搭建 | 1 天 | — |
| Phase 1 | 地图 + 路线 | 3 天 | Phase 0 |
| Phase 2 | AR 核心引擎（路面箭头） | 8 天 | Phase 1 |
| Phase 3 | 导航体验（语音/HUD/偏航） | 4 天 | Phase 2 |
| Phase 4 | 后端完整化 | 3 天 | Phase 1 |
| Phase 5 | 测试 + 发布 | 4 天 | Phase 3, 4 |

**总计：约 23 个工作日**（1 人全职），实际需预留 buffer（尤其是 Phase 2 AR 调试）。

---

## 降级策略 (MVP 最小可用版本)

如果时间紧张，先做一个可演示的半 AR 版本：

| 砍掉 | 保留 |
|---|---|
| 精确路面投影 → 固定 HUD 方向箭头 + 相机背景 | Camera 实时画面 |
| 后端服务 → 纯前端调用（暴露 Key，演示用） | 地图 + 路线规划 |
| POI 气泡 / 距离标签 | 路口方向箭头 |
| 语音播报 / 历史记录 | 模式切换（地图↔AR） |

这样 **Phase 0 + 1 + Phase 2 的前 5 天（到传感器融合+基本箭头）** 可在 **9 天内** 出一个可 Demo 的版本。

---

## Open Questions

1. **导航场景确认：** 步行为主还是骑行也覆盖？步行场景 AR 精度勉强够用，骑行对时效性要求更高。
2. **是否需要社交功能？** 如分享位置、组队导航等？
3. **商业化方向？** 免费工具还是后续对接商家 POI 广告？
4. **是否需要离线地图？** 山区/地铁场景无网络时怎么处理？
5. **企业还是个人账号？** 企业号才能开通微信支付（如果有商业化打算）。

---

> **下一步：** Phase 0 开始——搭建项目脚手架、申请 API Key、初始化仓库。确认以上 Open Questions 后可以直接进入实现。建议从 MVP 降级版本起步，快速验证 AR 可行性后再补全功能。
