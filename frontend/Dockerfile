# 前端 Dockerfile - React + Vite (多阶段构建)
# ========== 构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 配置淘宝镜像源加速
RUN npm config set registry https://registry.npmmirror.com

# 先复制 package 文件（利用 Docker 层缓存）
COPY package*.json ./

# 安装依赖（使用 npm ci 更快更稳定）
RUN npm ci --legacy-peer-deps

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# ========== 生产阶段 ==========
FROM nginx:alpine

# 复制构建产物到 Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置（支持 SPA 路由）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
