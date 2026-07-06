# Travel-web 线上部署完整操作指南

> 适用项目：Travel-web（Next.js 16 + React 19 + Supabase + Cloudinary + Amap）
>
> 更新日期：2026-07-01

---

## 目录

1. [第三方服务账号注册与配置](#一第三方服务账号注册与配置)
2. [环境变量整理](#二环境变量整理)
3. [选择部署方案](#三选择部署方案)
4. [部署前检查清单](#四部署前检查清单)
5. [首次部署](#五首次部署)
6. [域名与 HTTPS](#六域名与-https)
7. [持续维护](#七持续维护)
8. [常见问题排查](#八常见问题排查)

---

## 一、第三方服务账号注册与配置

项目依赖三个外部服务，需要在上线前逐一完成注册和配置。

### 1.1 Supabase（数据库 + 认证）

Supabase 是项目的核心后端，负责数据存储和用户认证。

#### 1.1.1 注册与创建项目

1. 打开 [supabase.com](https://supabase.com)，点击 **Start your project** 或 **Sign In** 注册账号（支持 GitHub / GitLab 登录）。
2. 登录后进入 Dashboard，点击 **New project**。
3. 填写信息：
   - **Name**：例如 `travel-web`
   - **Database Password**：设置一个强密码并妥善保存（之后无法在界面中找回）
   - **Region**：选择离目标用户最近的区域（亚洲用户选 `Southeast Asia (Singapore)` 或 `Northeast Asia (Tokyo)`）
   - **Pricing Plan**：初期选 Free Plan 即可，包含 500MB 数据库和 50,000 月活用户
4. 点击 **Create project**，等待 1-2 分钟初始化完成。

#### 1.1.2 创建数据库表

进入 Supabase Dashboard → SQL Editor，点击 **New query**，粘贴并执行以下 SQL：

```sql
-- 行程表
CREATE TABLE trips (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  content     TEXT,
  cover_image TEXT,
  category    TEXT,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 评论表
CREATE TABLE comments (
  id         BIGSERIAL PRIMARY KEY,
  trip_id    BIGINT REFERENCES trips(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 照片表
CREATE TABLE photos (
  id         BIGSERIAL PRIMARY KEY,
  trip_id    BIGINT REFERENCES trips(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt_text   TEXT,
  width      INTEGER,
  height     INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.1.3 配置 RLS（Row Level Security）策略

在 SQL Editor 中执行以下策略，确保数据安全：

```sql
-- === trips 表 ===
-- 允许任何人读取
CREATE POLICY "trips_public_read" ON trips
  FOR SELECT USING (true);

-- 仅允许认证用户创建/修改/删除
CREATE POLICY "trips_auth_write" ON trips
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "trips_auth_update" ON trips
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "trips_auth_delete" ON trips
  FOR DELETE TO authenticated USING (true);

-- === comments 表 ===
-- 允许任何人读取
CREATE POLICY "comments_public_read" ON comments
  FOR SELECT USING (true);

-- 允许任何人创建评论（也可以改为仅认证用户）
CREATE POLICY "comments_public_insert" ON comments
  FOR INSERT WITH CHECK (true);

-- === photos 表 ===
-- 允许任何人读取
CREATE POLICY "photos_public_read" ON photos
  FOR SELECT USING (true);

-- 仅允许认证用户操作
CREATE POLICY "photos_auth_write" ON photos
  FOR INSERT TO authenticated WITH CHECK (true);
```

> 执行完成后，重启 Supabase 的行级安全设置：左侧菜单 → Authentication → Settings → 确认 **Enable Row Level Security** 已对相关表打开。

#### 1.1.4 开启认证

1. 左侧菜单 → **Authentication** → **Providers**
2. 确认 **Email**  provider 已启用（默认开启）。
3. 如需其他登录方式（Google、GitHub 等），点击对应 provider 展开并填入 OAuth 凭证。
4. 在 **Email** 设置中，建议关闭 **Confirm email**（开发阶段），正式上线后可开启。

#### 1.1.5 获取 API 密钥

1. 左侧菜单 → **Settings** → **API**
2. 记录以下两个值（后续配置环境变量用）：
   - **Project URL**：`https://xxxxx.supabase.co`
   - **anon public key**：以 `eyJ` 开头的长字符串
3. **不要使用 `service_role` key**，它拥有绕过 RLS 的权限，只能用于服务端脚本。

#### 1.1.6 配置认证回调 URL

1. 左侧菜单 → **Authentication** → **URL Configuration**
2. **Site URL**：填入你的线上域名（如 `https://travel.example.com`），本地开发时可填 `http://localhost:3000`
3. **Redirect URLs**：添加 `https://你的域名/api/auth/callback` 和 `http://localhost:3000/api/auth/callback`（用英文逗号分隔）

#### 1.1.7 创建管理员账号

1. 左侧菜单 → **Authentication** → **Users** → **Add user**
2. 填写邮箱和密码，勾选 **Auto Confirm User**
3. 该用户即可访问 `/admin` 路由进行后台管理

---

### 1.2 Cloudinary（图片存储与 CDN）

Cloudinary 负责项目中所有图片的上传、存储和优化分发。

#### 1.2.1 注册账号

1. 打开 [cloudinary.com](https://cloudinary.com)，点击 **Sign Up** 注册免费账号。
2. 完成邮箱验证后进入 Dashboard。

#### 1.2.2 获取 API 密钥

Dashboard 首页即可看到：

| 字段 | 用途 |
|------|------|
| **Cloud Name** | 标识你的 Cloudinary 实例，会出现在图片 URL 中 |
| **API Key** | 用于服务端 API 调用 |
| **API Secret** | 用于服务端 API 签名，**不要暴露到客户端** |

#### 1.2.3 配置 Upload Preset（上传预设）

项目使用 unsigned upload preset 实现前端直传，需要提前创建：

1. 左侧菜单 → **Settings** → **Upload**
2. 滚动到底部 **Upload presets**，点击 **Add upload preset**
3. 配置：
   - **Preset name**：例如 `travel-web-uploads`
   - **Signing Mode**：选择 **Unsigned**
   - **Folder**：设置上传目标文件夹，如 `travel-web`（可选，方便管理）
   - **Allowed Formats**：限制为 `jpg, png, webp, avif`（防止上传非图片文件）
   - **Max File Size**：建议设为 `10000000`（10MB）
4. 点击 **Save**

> 创建的 preset name 需要在前端代码的图片上传请求中使用，见 `next-cloudinary` 组件配置。

---

## 二、环境变量整理

开发完成后，需要将所有环境变量配置到部署平台。以下是变量清单：

### 2.1 完整变量列表

| 变量名 | 值 | 来源 | 是否暴露到客户端 |
|--------|-----|------|:---:|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → Settings → API → Project URL | ✅ 是 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase → Settings → API → anon public key | ✅ 是 |
| `NEXT_PUBLIC_AMAP_WEB_KEY` | `你的高德Web服务Key` | 高德开放平台 → 应用管理 → Web服务 Key | ✅ 是 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `your-cloud-name` | Cloudinary Dashboard | ✅ 是 |
| `CLOUDINARY_API_KEY` | `123456789...` | Cloudinary Dashboard | ❌ 否（仅服务端） |
| `CLOUDINARY_API_SECRET` | `xxxxx...` | Cloudinary Dashboard | ❌ 否（仅服务端） |

> **重要**：以 `NEXT_PUBLIC_` 开头的变量会被 Next.js 打包进浏览器端 JavaScript 代码，任何人都能在浏览器中看到。因此 Supabase `service_role` key、Cloudinary `API Secret` 等敏感信息**绝对不能**加 `NEXT_PUBLIC_` 前缀。

### 2.2 本地开发环境配置

在项目根目录创建 `.env.local` 文件（已在 `.gitignore` 中，不会提交到仓库）：

```bash
# .env.local（仅本地使用）

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=xxxxx

# Amap（高德地图）Web 服务 Key
NEXT_PUBLIC_AMAP_WEB_KEY=你的高德Web服务Key
```

### 2.3 在部署平台配置环境变量

无论选择哪家平台，环境变量的配置位置通常都在：

- **Vercel**：项目 Dashboard → Settings → Environment Variables
- **Netlify**：Site Dashboard → Site settings → Environment variables
- **Docker**：通过 `--env-file` 或 `docker-compose.yml` 中的 `environment` 字段
- **自有服务器**：在项目根目录创建 `.env.production` 文件

---

## 三、选择部署方案

### 3.1 方案对比

| 维度 | Vercel | 自有服务器（Docker） | 自有服务器（直接部署） |
|------|--------|---------------------|---------------------|
| 配置复杂度 | ⭐ 极低 | ⭐⭐⭐ 中等 | ⭐⭐ 较低 |
| 费用 | 免费层足够个人项目 | 服务器月租 | 服务器月租 |
| 自动扩缩容 | ✅ 自动 | ❌ 需手动 | ❌ 需手动 |
| Next.js 兼容性 | ✅ 官方最佳 | ⚠️ 需自行验证 | ⚠️ 需自行验证 |
| 自定义控制 | 受限 | ✅ 完全控制 | ✅ 完全控制 |
| SSL 证书 | ✅ 自动 | ❌ 需手动 certbot | ❌ 需手动 certbot |

### 3.2 方案 A：Vercel 部署（推荐）

Vercel 是 Next.js 的开发公司，提供最无缝的部署体验。

#### 3.2.1 连接仓库

1. 打开 [vercel.com](https://vercel.com)，用 GitHub / GitLab / Bitbucket 账号登录。
2. 点击 **New Project**。
3. 在列表中选择 `Travel-web` 仓库。如果仓库未显示，点击 **Adjust GitHub App Permissions** 授权 Vercel 访问。
4. 点击 **Import**。

#### 3.2.2 配置项目

1. **Framework Preset**：自动识别为 Next.js，无需修改。
2. **Root Directory**：保持默认 `./`。
3. **Build Command**：保持默认 `next build`。
4. **Output Directory**：保持默认 `.next`。
5. **Environment Variables**：逐一添加 [第二节](#二环境变量整理) 中列出的所有变量（点 Add 逐个填入 Name → Value）。

#### 3.2.3 首次部署

1. 点击 **Deploy**，等待构建日志输出。
2. 构建完成后会自动分配一个 `xxx.vercel.app` 域名。
3. 点击生成的链接访问站点，逐页检查。
4. 如果页面出现问题，Vercel 提供部署日志，可在 Deployments 中查看详细错误信息。

#### 3.2.4 添加团队协作（可选）

1. 项目 Dashboard → **Settings** → **General** → 滚动到底部 **Transfer** 或 **Manage**。
2. 可邀请其他 Vercel 用户作为团队成员，共同管理部署。

#### 3.2.5 绑定自定义域名

1. 项目 Dashboard → **Settings** → **Domains**。
2. 输入你的域名（如 `travel.yourdomain.com`）。
3. Vercel 会给出需要添加的 DNS 记录，前往域名 DNS 管理后台添加：
   - **根域名**（如 `yourdomain.com`）：添加 A 记录指向 `76.76.21.21`
   - **子域名**（如 `travel.yourdomain.com`）：添加 CNAME 记录指向 `cname.vercel-dns.com`
4. DNS 生效后（通常几分钟到几小时），Vercel 自动申请并配置 SSL 证书。

---

### 3.3 方案 B：自有服务器直接部署

适用于已有云服务器（阿里云、腾讯云、AWS EC2 等）的场景。

#### 3.3.1 服务器环境准备

```bash
# 1. 更新系统（以 Ubuntu 为例）
sudo apt update && sudo apt upgrade -y

# 2. 安装 Node.js 20+（使用 NodeSource 源）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 验证安装
node -v   # 应输出 v20.x.x
npm -v    # 应输出 10.x.x

# 4. 安装 Nginx（反向代理）
sudo apt install -y nginx

# 5. 安装 PM2（进程守护）
sudo npm install -g pm2

# 6. 安装 Git
sudo apt install -y git
```

#### 3.3.2 拉取项目与构建

```bash
# 1. 创建项目目录
mkdir -p /var/www
cd /var/www

# 2. 克隆项目
git clone https://github.com/你的用户名/Travel-web.git
cd Travel-web

# 3. 创建环境变量文件
nano .env.production
# 粘贴所有环境变量（见第二节），Ctrl+X 保存退出

# 4. 安装依赖
npm ci

# 5. 构建项目
npm run build

# 6. 使用 PM2 启动
pm2 start npm --name "travel-web" -- run start
pm2 save
pm2 startup  # 设置开机自启，按提示执行输出的命令
```

#### 3.3.3 配置 Nginx 反向代理

```bash
sudo nano /etc/nginx/sites-available/travel-web
```

写入以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # 代理到 Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件大小限制（如果需要通过 Next.js 上传）
    client_max_body_size 20m;
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/travel-web /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 3.3.4 配置 HTTPS（使用 Let's Encrypt）

```bash
# 1. 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. 获取证书（确保 DNS 已指向服务器 IP）
sudo certbot --nginx -d your-domain.com

# 3. 设置自动续期（证书有效期 90 天）
sudo certbot renew --dry-run  # 测试自动续期
# certbot 会自动添加 cron 任务，无需额外配置
```

#### 3.3.5 更新部署

后续代码更新后，在服务器上执行：

```bash
cd /var/www/Travel-web
git pull origin main
npm ci
npm run build
pm2 restart travel-web
```

建议将这些命令写成一个脚本：

```bash
# deploy.sh
#!/bin/bash
set -e
cd /var/www/Travel-web
echo ">>> Pulling latest code..."
git pull origin main
echo ">>> Installing dependencies..."
npm ci
echo ">>> Building..."
npm run build
echo ">>> Restarting PM2..."
pm2 restart travel-web
echo ">>> Done!"
```

---

### 3.4 方案 C：Docker 部署

如果你偏好容器化部署，可以使用以下配置。

#### 3.4.1 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

# 依赖安装阶段
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY .env.production .env.production
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

> **注意**：使用 standalone 模式需要在 `next.config.ts` 中添加 `output: "standalone"`。

#### 3.4.2 docker-compose.yml

```yaml
version: "3.8"
services:
  travel-web:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
```

#### 3.4.3 启动

```bash
docker compose up -d --build
```

---

## 四、部署前检查清单

在上线前，逐项确认以下内容：

| # | 检查项 | 如何验证 | 状态 |
|---|--------|---------|:---:|
| 1 | `npm run build` 无报错 | 本地执行，确认 0 error | ☐ |
| 2 | `npm run lint` 无报错 | 本地执行 ESLint | ☐ |
| 3 | Supabase 表结构完整 | 在 Supabase Table Editor 查看 trips / comments / photos 表是否存在 | ☐ |
| 4 | RLS 策略已启用 | 在 Supabase Authentication → Policies 中确认策略存在且状态为 ON | ☐ |
| 5 | Cloudinary Upload Preset 已创建 | Settings → Upload → Upload presets | ☐ |
| 6 | Amap Web Key 有效 | 本地 `NEXT_PUBLIC_AMAP_WEB_KEY` 环境变量配置后，地图页搜索可返回建议 | ☐ |
| 7 | `next.config.ts` images 域名白名单 | 确认 remotePatterns 包含 `res.cloudinary.com`、`images.unsplash.com` | ☐ |
| 8 | `.env*` 在 `.gitignore` 中 | `git status` 无 env 文件出现 | ☐ |
| 9 | Supabase Auth 回调 URL 已配置 | Authentication → URL Configuration → Redirect URLs 包含 `https://你的域名/api/auth/callback` | ☐ |
| 10 | 管理员账号已创建 | Supabase → Authentication → Users 中至少有一个通过后台创建的用户 | ☐ |
| 11 | `npm run start` 生产模式本地测试通过 | `npm run build && npm run start`，浏览器访问 `localhost:3000` 逐页检查 | ☐ |
| 12 | 部署平台环境变量全部填写完毕 | 对照第二节变量表逐一核对 | ☐ |

### 4.1 生产模式本地验证操作

这是上线前最重要的一步，能模拟线上真实环境：

```bash
# 1. 确保 .env.local 包含所有必要的环境变量
cat .env.local

# 2. 生产构建
npm run build

# 3. 启动生产模式服务器
npm run start

# 4. 访问 http://localhost:3000 逐页检查：
#    - /           首页，动效正常
#    - /trips      行程列表，数据加载正常
#    - /trips/[slug] 行程详情，评论功能正常
#    - /gallery    相册页，图片加载正常
#    - /map        地图页，3D 地球渲染正常
#    - /admin      应重定向到 /admin/login
#    - /admin/login 登录功能正常
```

---

## 五、首次部署

### 5.1 代码提交

确保所有代码已提交到版本控制：

```bash
git add .
git commit -m "chore: ready for production deployment"
git push origin main
```

### 5.2 触发部署

**Vercel 用户：**
- 自动部署已开启，推送代码后 Vercel 会自动开始部署
- 进入 Vercel Dashboard → Deployments 查看进度和日志

**自有服务器用户：**
```bash
# SSH 登录服务器后执行
cd /var/www/Travel-web
git pull origin main
npm ci
npm run build
pm2 restart travel-web
```

### 5.3 部署后验证清单

上线后逐项检查：

| # | 验证项 | 检查要点 |
|---|--------|---------|
| 1 | 首页 (`/`) | Hero 动画、统计数据、行程列表正常展示 |
| 2 | 行程列表 (`/trips`) | 数据从 Supabase 加载，卡片渲染正常 |
| 3 | 行程详情 (`/trips/[slug]`) | Markdown 内容渲染、图片展示、评论区正常 |
| 4 | 相册 (`/gallery`) | 图片从 Cloudinary 加载、lightbox 交互正常 |
| 5 | 地图 (`/map`) | 3D 地球渲染、地图交互正常，地点搜索可定位 |
| 6 | 后台 (`/admin`) | 未登录自动跳转登录页 |
| 7 | 登录 (`/admin/login`) | Supabase 认证正常，登录后进入后台 |
| 8 | 评论功能 | 提交评论后能在 Supabase 表中查到记录 |
| 9 | 图片上传 | 上传图片后能在 Cloudinary Dashboard 看到 |
| 10 | HTTPS | 浏览器地址栏显示锁形图标 |
| 11 | 移动端 | 手机浏览器访问，响应式布局正常 |

### 5.4 性能检查

1. 运行 [PageSpeed Insights](https://pagespeed.web.dev/) 检查性能分数
2. 重点关注：
   - **LCP**（Largest Contentful Paint）：应 < 2.5s（Three.js 3D 场景可能影响）
   - **CLS**（Cumulative Layout Shift）：应 < 0.1
   - **图片优化**：确认 Cloudinary 自动格式转换（WebP/AVIF）生效
3. 查看 Vercel Analytics（如已开启）或自建监控的 Core Web Vitals 数据

---

## 六、域名与 HTTPS

### 6.1 域名购买

1. 选择域名注册商：阿里云（国内）、Namecheap（海外）、GoDaddy 等
2. 搜索心仪域名，检查是否可注册
3. 购买并完成实名认证（国内注册商需要）

### 6.2 DNS 配置

根据部署方案添加 DNS 记录：

**Vercel 部署：**
| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| CNAME | `travel`（或 `@` 代表根域名） | `cname.vercel-dns.com` |

如果是根域名，还需添加：
| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| A | `@` | `76.76.21.21` |

**自有服务器：**
| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| A | `@`（根域名） | 你的服务器公网 IP |
| A | `www` | 你的服务器公网 IP |

### 6.3 SSL 证书

- **Vercel / Netlify**：自动申请和续期，无需手动操作
- **自有服务器**：使用 Certbot 自动获取 Let's Encrypt 证书（详见 3.3.4 节）

### 6.4 DNS 生效验证

```bash
# 查看 DNS 解析是否生效
nslookup your-domain.com
# 或
dig your-domain.com
```

DNS 修改后全球生效通常需要几分钟到 48 小时。可以使用 [whatsmydns.net](https://www.whatsmydns.net/) 查看全球解析进度。

---

## 七、持续维护

### 7.1 定期更新依赖

```bash
# 查看哪些依赖有更新
npm outdated

# 谨慎更新（逐个更新并测试，避免破坏性变更）
npm update <package-name>

# 安全审计
npm audit

# 修复安全漏洞
npm audit fix
```

建议频率：每 2-4 周检查一次。注意 Next.js 16 的更新，关注官方 Changelog 中的 Breaking Changes。

### 7.2 数据库备份

**Supabase：**
- Free Plan：每日自动备份，保留 7 天
- Pro Plan：可配置 Point-in-Time Recovery（PITR）

手动备份（推荐在重大变更前执行）：
1. Supabase Dashboard → Database → Backups
2. 点击 **Create Backup** 或使用 CLI 导出 SQL

### 7.3 密钥轮换

定期更换 API 密钥可以提高安全性。建议每季度检查一次：

| 密钥 | 轮换方式 |
|------|---------|
| Supabase anon key | Settings → API → 生成新 key |
| Amap Web Key | 应用管理 → 创建新 Key → 替换 → 删除旧 Key |
| Cloudinary API Secret | Settings → Security → Regenerate |

> 每次更换后需同步更新部署平台的环境变量并重新部署。

### 7.4 监控与报警

#### Vercel 内置监控

- Dashboard → Analytics：查看流量、页面性能、错误率
- 设置警报阈值（Pro Plan 功能）

#### 自建 Sentry 错误监控（可选）

```bash
npm install @sentry/nextjs
```

按 [Sentry Next.js 文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/) 配置。

### 7.5 服务用量监控

定期检查各项服务的免费额度：

| 服务 | 免费额度 | Dashboard 入口 |
|------|---------|---------------|
| Supabase | 500MB DB, 50K MAU | [supabase.com/dashboard](https://supabase.com/dashboard) |
| Cloudinary | 25GB 存储, 25GB 带宽/月 | [cloudinary.com/console](https://cloudinary.com/console) |
| Amap | 输入提示/POI 搜索各 5000 次/日 | [console.amap.com](https://console.amap.com) |
| Vercel | 100GB 带宽, 6K 构建分钟/月 | [vercel.com/dashboard](https://vercel.com/dashboard) |

### 7.6 更新部署流程总结

```
本地修改 → 测试通过 → git push → 自动部署(Vercel) / 手动部署(服务器) → 验证
```

---

## 八、常见问题排查

### 8.1 页面白屏, 控制台报 JavaScript 错误

**可能原因：**
- 环境变量未正确配置，前端未拿到 key
- Three.js 等第三方包 SSR 问题

**排查步骤：**
1. 打开浏览器 DevTools → Console，查看具体错误信息
2. 检查 Network 面板，确认 JS 文件正常加载
3. 检查环境变量：访问 `/api/debug`（如有）或查看页面源代码中是否包含变量值
4. 对于 Three.js 组件，确认使用了动态导入：`dynamic(() => import('./EarthGlobe'), { ssr: false })`

### 8.2 图片不显示

**可能原因：**
- Cloudinary 域名未在 `next.config.ts` 中配置
- Cloudinary 上传失败

**排查步骤：**
1. 检查 `next.config.ts` 中 `images.remotePatterns` 是否包含 `res.cloudinary.com`
2. 打开图片链接直接访问，确认图片是否存在于 Cloudinary
3. 检查 Cloudinary Dashboard 中是否有对应图片

### 8.3 地图页 3D 地球不渲染

**可能原因：**
- Three.js 依赖在服务端报错（Canvas 需要浏览器环境）
- 地球贴图 URL（threejs.org）加载失败

**排查步骤：**
1. 打开 DevTools → Console 看是否有 Three.js / WebGL 相关错误
2. 确认组件使用了动态导入：`dynamic(() => import('./EarthGlobe'), { ssr: false })`
3. 检查 Network 面板，确认地球贴图 `earth_atmos_2048.jpg` 是否加载成功

### 8.4 数据库操作失败 / 无数据

**可能原因：**
- RLS 策略阻止了操作
- 表结构不存在

**排查步骤：**
1. Supabase Dashboard → Table Editor 查看表是否存在
2. 确认 RLS 策略是否正确配置（见 1.1.3 节）
3. 使用 Supabase SQL Editor 手动执行一条 SELECT 确认能查到数据

### 8.5 登录失败 / 认证回调不工作

**可能原因：**
- 回调 URL 未在 Supabase 中配置
- 域名变更后未更新 Site URL

**排查步骤：**
1. Supabase → Authentication → URL Configuration → Site URL 是否正确
2. Redirect URLs 是否包含当前域名
3. 浏览器 DevTools → Network → 查看回调请求的状态码

### 8.6 部署后样式异常

**可能原因：**
- Tailwind CSS v4 配置问题
- CSS 文件未正确加载

**排查步骤：**
1. 检查 `postcss.config.mjs` 中是否正确配置了 `@tailwindcss/postcss`
2. 确认 `globals.css` 中 `@import "tailwindcss"` 存在
3. 清除 Vercel 部署缓存：Deployments → 点击最新部署 → Redeploy 勾选清除缓存

### 8.7 Next.js 16 特定问题

根据项目 `AGENTS.md` 提示，Next.js 16 有破坏性变更。遇到框架相关问题：

1. 查阅 `node_modules/next/dist/docs/` 中的官方文档
2. 检查 Next.js 16 的 [GitHub Release Notes](https://github.com/vercel/next.js/releases) 中的 Breaking Changes
3. 特别关注 Middleware、Route Handler、Image 组件相关的 API 变化

### 8.8 快速诊断脚本

在服务器上执行以下命令可快速定位问题：

```bash
# 检查 Node.js 版本
node -v

# 检查 Next.js 是否正常运行
curl http://localhost:3000 -I

# 检查 PM2 进程状态
pm2 status

# 检查 PM2 日志
pm2 logs travel-web --lines 50

# 检查 Nginx 状态
sudo systemctl status nginx
sudo nginx -t

# 检查磁盘和内存
df -h
free -m
```

---

> **文档维护说明**：本文档随项目演进持续更新。当有新服务接入或流程变更时，请同步更新本文档并提交到仓库。建议在每次完成一次部署后，在此记录遇到的问题和解决方案，逐步完善成项目的部署知识库。
