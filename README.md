# EPA Tool - 地板滚球 AI 动作分析系统

> 运动指导员专用的 AI 姿势分析与前后测数据管理平台

## ✨ 功能

- 🔐 **Google 帐号登入** — 一键注册/登入
- 🤖 **AI 姿势即时分析** — MediaPipe 驱动的生物力学分析引擎
- 📊 **前后测对比** — 视觉化对比训练前后的进步
- 📥 **Excel 报告导出** — 三工作表完整报告
- 📌 **手动投球标记** — 关键帧快照
- 👥 **长辈管理** — CRUD 操作

## 🚀 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
NEXT_PUBLIC_SUPABASE_URL=https://bsbobzyftwifnwfolblh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. 初始化数据库

在 Supabase Studio → SQL Editor 中执行 `supabase-migration.sql`

### 3. 启用 Google OAuth

1. Supabase Dashboard → Authentication → Providers → 启用 Google
2. Google Cloud Console → 创建 OAuth 2.0 client ID
3. 回调 URL: `https://bsbobzyftwifnwfolblh.supabase.co/auth/v1/callback`

### 4. 运行

```bash
npm install
npm run dev
```

## 📁 项目结构

```
epa_tool/
├── app/
│   ├── (auth)/login/         # 登入页面
│   ├── (dashboard)/          # 仪表板布局
│   │   ├── dashboard/        # 首页
│   │   ├── elders/           # 长辈管理
│   │   └── analysis/[id]/    # AI 分析页面
│   ├── api/export/[id]/      # Excel 导出 API
│   └── auth/callback/        # OAuth 回调
├── components/analysis/      # AI 分析组件
├── lib/
│   ├── analysis/             # 核心 AI 引擎
│   ├── export/               # 数据导出
│   └── supabase/             # Supabase 客户端
├── middleware.ts              # 认证中间件
└── supabase-migration.sql    # 数据库迁移
```

## 🔧 技术栈

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL)
- MediaPipe Pose
- xlsx (SheetJS)

## 📄 许可证

Private
