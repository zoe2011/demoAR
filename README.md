# DemoAR — 微信实景导航小程序

> 基于微信生态的增强现实步行导航。举起手机，导航箭头就画在真实路面上。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 微信小程序原生 + TypeScript |
| AR 渲染 | Camera + Canvas 2D |
| 地图 | 腾讯地图 JS SDK |
| 后端 | Java 21 + Spring Boot 3 + MyBatis-Plus |
| 数据库 | MySQL 8.0 |

## 快速开始

### 前置条件

- 微信开发者工具
- Java 21 + Maven 3.9+
- MySQL 8.0
- 腾讯地图 API Key → [申请](https://lbs.qq.com/)

### 小程序前端

```bash
cd miniprogram
npm install
npx tsc --noEmit        # 类型检查
```

1. 在 `project.config.json` 中替换 `appid` 为你的微信 AppID
2. 用微信开发者工具打开 `miniprogram/` 目录

### Java 后端

```bash
cd server
# 1. 编辑 src/main/resources/application.yml
#    - 填入 TENCENT_MAP_KEY, WECHAT_APPID, WECHAT_SECRET
#    - 配置 MySQL 连接信息
# 2. 执行建表脚本
mysql -u root -p < src/main/resources/db/schema.sql
# 3. 启动
mvn spring-boot:run
```

### 前端连接后端

编辑 `miniprogram/app.ts` 中的 `baseUrl` 为你的后端地址。

## 项目结构

```
demoAR/
├── miniprogram/               # 微信小程序 (60+ 文件)
│   ├── pages/
│   │   ├── index/             # 首页：地图 + 搜索
│   │   ├── ar-nav/            # AR 导航：Camera + Canvas 叠加
│   │   ├── route-detail/      # 路线详情 + 步骤列表
│   │   ├── history/           # 导航历史
│   │   └── mine/              # 个人中心 + 微信登录
│   ├── components/
│   │   ├── search-bar/        # 搜索建议组件
│   │   └── ar-renderer/       # AR 渲染引擎（Phase 2 核心）
│   ├── services/              # 定位 / 地图 / 导航 API 封装
│   ├── utils/
│   │   ├── geo-utils.ts       # GPS↔ENU 坐标转换 + 距离计算
│   │   └── sensor-filter.ts   # 低通/互补/卡尔曼滤波器
│   └── types/                 # 完整类型定义 + 最小化 WeChat 声明
│
├── server/                    # Java 后端 (24 文件)
│   ├── pom.xml                # Spring Boot 3 + MyBatis-Plus + JWT
│   └── src/main/java/com/demoar/
│       ├── controller/        # Auth / Route / Place / User
│       ├── service/           # AuthService + TencentMapService
│       ├── mapper/            # MyBatis-Plus BaseMapper × 4
│       ├── entity/            # User / NavigationRecord / FavoritePlace / FavoriteRoute
│       ├── interceptor/       # JWT 鉴权拦截器
│       └── exception/         # 全局异常处理
│
└── .hermes/plans/             # 完整开发计划
```

## 开发阶段

| Phase | 内容 | 状态 |
|---|---|---|
| 0 | 环境搭建 + 项目脚手架 | ✅ 完成 |
| 1 | 地图 + 路线规划 + 搜索 | ✅ 前端完成 / 后端等待 Java 环境验证 |
| 2 | AR 核心引擎（路面箭头投影） | ⬜ 骨架就绪，待实现投影管线 |
| 3 | 导航体验（语音/偏航/HUD） | ⬜ 待进行 |
| 4 | 后端完整化（收藏/历史/限流） | ⬜ 骨架就绪 |
| 5 | 测试 + 审核 + 发布 | ⬜ 待进行 |

## 核心 AR 投影管线（Phase 2）

```
GPS 路线点 → ENU 坐标系 → 路面平面(水平假设)
  → 相机坐标系(外参: GPS+IMU+罗盘) → 透视投影(内参: FOV+分辨率)
  → Canvas 2D 绘制箭头（近大远小）
```

关键文件：`utils/geo-utils.ts` `utils/sensor-filter.ts` `components/ar-renderer/ar-renderer.ts`

## License

MIT
