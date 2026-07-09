# 用户身份绑定 · 手动操作清单

> 以下操作需在 Supabase Dashboard 和本地浏览器中依次完成。

---

## 一、Supabase Dashboard — 执行数据库迁移

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择项目
2. 左侧菜单 → **SQL Editor** → 点击 **New query**
3. 打开项目文件 `supabase/migrations/002_add_user_identity.sql`
4. 复制全部内容粘贴到编辑器中，点击右下角 **Run**

### 这段 SQL 做了什么

| 操作 | 说明 |
|------|------|
| 新增列 | `trips`、`ai_guides` 表添加 `user_id UUID` |
| 新建表 | `profiles` 表（`user_id`, `role`, `display_name`） |
| 重写 RLS | 所有表的 SELECT/INSERT/UPDATE/DELETE 策略改为基于所有权 + 管理员权限 |
| 数据回填 | 现有行程和攻略归属到第一个用户，该用户自动设为 `admin` |
| 初始化 profiles | 为 `auth.users` 中所有用户创建 profiles 行 |

---

## 二、Supabase Dashboard — 确认管理员角色

执行以下查询：

```sql
SELECT p.user_id, p.role, u.email
FROM profiles p
JOIN auth.users u ON u.id = p.user_id;
```

预期你的账户 `role` 为 **admin**。

如果不是，执行修正（替换 `<你的UUID>`）：

```sql
UPDATE profiles SET role = 'admin' WHERE user_id = '<你的UUID>';
```

> UUID 位置：Authentication → Users → 点击你的邮箱 → 详情页中的 **User UID**

---

## 三、Supabase Dashboard — 创建测试用普通用户

1. 左侧菜单 → **Authentication** → **Users** → **Add user**
2. 填写表单：
   - **Email**：使用邮箱别名即可（如 `yourname+test@email.com`）
   - **Password**：设置一个密码
   - 勾选 ✅ **Auto Confirm User**
3. 点击 **Create user**

> Auto Confirm 后无需验证邮箱，可直接在登录页使用。

---

## 四、本地浏览器 — 手动测试

启动开发服务器后（`npm run dev`），在 `http://localhost:3007` 按以下顺序测试：

### 管理员场景

- [ ] 1. 管理员登录 → 仪表盘显示 **"管理员"** 标签 + 全站统计（含用户数）
- [ ] 2. 行程管理 →「所有行程」标签页，显示全部用户的行程，含 **「所有者」列**
- [ ] 3.「我的行程」标签页 → 仅显示自己的行程，无「所有者」列
- [ ] 4. 编辑他人行程 → 页面标题旁显示 **「其他用户的行程」** 标签

### 普通用户场景

- [ ] 5. 普通用户登录 → 仪表盘 **不显示** 管理员标签、不显示用户数统计
- [ ] 6. 行程管理 → 仅显示自己的行程，**无标签页切换**、无「所有者」列
- [ ] 7. 越权测试 → 浏览器直接访问 `/admin/trips/<他人行程ID>/edit`，应重定向回行程列表

### 写入验证

- [ ] 8. 创建新行程 → 发布后，确认只有创建者和管理员能在管理后台看到它

---

## 检查清单

| # | 步骤 | 平台 | 位置 |
|---|------|------|------|
| 1 | 执行迁移 SQL | Supabase | SQL Editor → New query → Run |
| 2 | 确认管理员角色 | Supabase | SQL Editor → 查询 profiles 表 |
| 3 | 创建测试用户 | Supabase | Authentication → Users → Add user |
| 4 | 手动测试 8 项 | 浏览器 | `localhost:3007` |
