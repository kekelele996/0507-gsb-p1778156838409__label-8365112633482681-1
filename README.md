# 村级综合管理系统 (Village Management System)

## 🧭 Project Type
- **Type**: A) FULLSTACK_WEB
- **说明**: 前端 + 后端 + 数据库（全栈 Web 应用）

## 🧩 技术栈
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend**: PHP 8.2 + Apache
- **Database**: MySQL 8.0
- **Container**: Docker + Docker Compose

## 🚀 快速启动（唯一命令）

### 前置要求
- 确保 Docker Desktop / Docker Engine 已安装并运行

### 启动步骤
1. 克隆或下载项目到本地
2. 在项目根目录执行：
   ```bash
   docker compose up
   ```
3. 等待所有服务启动完成（首次启动需要构建镜像，约 3-5 分钟）

### 访问地址
- **前端页面**: http://localhost:3000
- **后端 API**: http://localhost:8000/api
- **数据库**: localhost:3306

## 👤 测试账号

### 管理员账号
- **用户名**: `admin`
- **密码**: `admin123`
- **权限**: 管理员（可访问所有功能，包括用户管理）

### 普通用户账号
- **用户名**: `user`
- **密码**: `user123`
- **权限**: 普通用户（可访问数据模块，无用户管理权限）

### 密码重置
如使用已有数据库，请执行以下 SQL 重置密码：
```sql
-- 重置管理员密码为 admin123
UPDATE admin_users SET password = '$2y$10$tAG0SKrmZGLwHYppS1xUje2MLWMOuadHIDjQUNaVn.cLbYbE0WU5S' WHERE username = 'admin';
-- 重置普通用户密码为 user123
UPDATE admin_users SET password = '$2y$10$91Gq07gc77n84VfXF/CjfOEBOEq4jaeOr1UyImmVcUXnLekq1dEHe' WHERE username = 'user';
```

## 🔐 认证与安全

### 登录接口
- **端点**: `POST /api/auth.php/login`
- **请求体**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "id": 1,
      "username": "admin",
      "real_name": "系统管理员",
      "email": "admin@example.com",
      "role": "admin",
      "token": "base64_encoded_jwt_token",
      "expires_in": 86400
    }
  }
  ```

### Token 使用方式
登录成功后，所有 API 请求必须在请求头中包含认证 Token：

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>'
}
```

### Token 格式说明
- **格式**: `base64(user_id:username:timestamp:signature)`
- **签名算法**: HMAC-SHA256
- **有效期**: 24 小时（86400 秒）
- **安全特性**:
  - 使用服务器密钥签名，防止伪造
  - 中间件强制验证签名完整性
  - 过期 Token 自动拒绝

### 受保护的 API
所有数据接口均需认证，包括：
- `GET /api/admin.php/me` - 获取当前用户信息
- `GET /api/admin.php/users` - 获取用户列表（管理员）
- `GET /api/death_records.php/list` - 死亡登记记录
- `GET /api/village_contacts.php/list` - 村级联系人
- `GET /api/subsistence.php/list` - 低保人员信息
- `GET /api/special_assistance.php/list` - 特困供养人员信息

### 权限说明
- **管理员 (admin)**: 可访问所有功能，包括用户管理
- **普通用户 (user)**: 仅可查看数据，无法执行管理操作
- 未认证请求返回 `401 Unauthorized`
- 权限不足返回 `403 Forbidden`

## ✅ 功能清单（逐条对齐 prompt.md）

### 核心模块
- [ ] **F1: 人口死亡登记模块**
  - 死亡人员信息的增删改查
  - 字段：姓名、性别、年龄、死亡日期、死亡原因、登记日期
  
- [ ] **F2: 村级联系人模块**
  - 联系人信息的增删改查
  - 字段：姓名、职务、联系电话、所属村组
  
- [ ] **F3: 低保模块**
  - 低保人员信息的增删改查
  - 字段：姓名、身份证号、家庭人口、补助金额、评定日期
  
- [ ] **F4: 特困供养人员模块**
  - 特困人员信息的增删改查
  - 字段：姓名、供养类型、补助标准、入住日期
  
- [ ] **F5: 后台管理模块**
  - 管理员登录/权限控制
  - 数据汇总统计
  - 数据导入/导出
  
- [ ] **F6: UI/UX 美观度**
  - 现代化 UI 设计（Tailwind CSS）
  - 响应式布局，支持移动端访问

## 🔎 自测说明

### 成功路径
1. 启动系统：`docker compose up`
2. 访问前端：http://localhost:3000
3. 使用管理员账号登录
4. 进入各功能模块进行数据操作
5. 验证数据的增删改查功能

### 失败路径
1. 未登录用户访问管理页面 → 跳转登录页
2. 删除数据时有确认提示 → 防止误操作
3. 表单验证 → 必填项未填时显示错误提示

### 边界/异常
- 数据库连接失败时显示友好提示
- 网络请求超时自动重试
- 表单提交失败时保留用户输入

## 🧾 证据文件

### 启动证明
- [ ] `evidence/01_boot.png` - Docker 启动日志截图
- [ ] `evidence/02_homepage.png` - 系统首页截图

### 功能证明
- [ ] `evidence/f1_death_registration.png` - 人口死亡登记模块
- [ ] `evidence/f2_village_contacts.png` - 村级联系人模块
- [ ] `evidence/f3_subsistence.png` - 低保模块
- [ ] `evidence/f4_special_assistance.png` - 特困供养人员模块
- [ ] `evidence/f5_admin_panel.png` - 后台管理模块
- [ ] `evidence/f6_ui_design.png` - UI 设计展示

### 工程质量
- [ ] `evidence/99_tree.png` - 目录结构截图
- [ ] `evidence/98_code.png` - 关键代码片段
- [ ] `evidence/trace.md` - AI 对话轨迹

## 📊 项目结构

```
Project Root/
├── README.md              # 项目说明文档
├── docker-compose.yml     # Docker Compose 配置
├── prompt.md              # 原始需求文档
├── CONSTRAINTS.md         # 交付约束
├── .workflow/             # 工作流文件
│   └── progress.json      # 进度追踪
├── frontend/              # 前端代码
│   ├── Dockerfile
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   └── api/           # API 调用
│   └── package.json
├── backend/               # 后端代码
│   ├── Dockerfile
│   ├── src/               # PHP 源码
│   │   ├── api/           # API 接口
│   │   ├── config/        # 配置文件
│   │   └── models/        # 数据模型
│   └── init.sql           # 数据库初始化
└── evidence/              # 截图/录屏证据
```

## 📝 开发说明

### 前端开发
- 使用 React 18 + Vite 构建
- UI 组件库：shadcn/ui + Tailwind CSS
- 状态管理：React Hooks
- 路由：React Router

### 后端开发
- PHP 8.2 + Apache
- RESTful API 设计
- 数据库：MySQL 8.0
- 认证：JWT Token

### 数据库设计
- `death_records` - 死亡登记表
- `village_contacts` - 村级联系人表
- `subsistence` - 低保人员表
- `special_assistance` - 特困供养人员表
- `admin_users` - 管理员用户表

---

**生成时间**: 2026-01-20  
**AI Assistant**: Claude Code
