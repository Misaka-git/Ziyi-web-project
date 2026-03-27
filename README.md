# NACE Competency Tracker 部署指南

## 部署步骤

### 1. 导出 Supabase 数据库

当前项目使用的是 Claude 提供的临时 Supabase 实例。你需要将数据迁移到自己的 Supabase 项目：

#### 步骤：

1. **创建自己的 Supabase 账号**
   - 访问 [supabase.com](https://supabase.com)
   - 注册并创建一个新项目

2. **迁移数据库结构**
   - 在新的 Supabase 项目中，进入 SQL Editor
   - 依次运行 `supabase/migrations/` 文件夹中的所有迁移文件（按文件名顺序）：
     - `20260302155551_create_biology_jobs_system.sql`
     - `20260302161436_add_onet_work_activities.sql`
     - `20260302162320_fix_security_indexes_and_rls.sql`
     - `20260302162859_improve_rls_policies_validation.sql`
     - `20260302163306_remove_unused_indexes_fix_rls.sql`
     - `20260302173447_add_custom_jobs_table.sql`

3. **导出现有数据**
   - 从当前 Claude 环境的数据库中导出数据
   - 主要表：`jobs`, `nace_competencies`, `onet_activities`, `job_onet_activities`
   - 在新的 Supabase 项目中导入这些数据

4. **更新环境变量**
   - 复制 `.env` 文件为 `.env.local`
   - 更新以下变量为你自己的 Supabase 项目信息：
     ```
     VITE_SUPABASE_URL=你的_supabase_项目_url
     VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key
     ```

### 2. 部署网站

推荐使用以下平台之一：

#### 选项 A: Vercel（推荐）
1. 在 [vercel.com](https://vercel.com) 注册账号
2. 连接你的 GitHub 仓库
3. 添加环境变量（从 `.env.local` 复制）
4. 点击部署

#### 选项 B: Netlify
1. 在 [netlify.com](https://netlify.com) 注册账号
2. 连接你的 GitHub 仓库
3. 构建命令：`npm run build`
4. 发布目录：`dist`
5. 添加环境变量

### 3. 配置自定义域名

#### 在 Vercel：
1. 进入项目设置 → Domains
2. 添加你的域名
3. 按照提示在域名注册商处添加 DNS 记录

#### 在 Netlify：
1. 进入 Site settings → Domain management
2. 添加自定义域名
3. 更新域名的 DNS 设置

## 项目结构

```
project/
├── src/
│   ├── App.tsx              # 主应用组件
│   ├── lib/
│   │   ├── supabase.ts      # Supabase 客户端配置
│   │   └── database.types.ts # 数据库类型定义
├── supabase/
│   └── migrations/          # 数据库迁移文件
├── .env                     # 环境变量（不要提交到 git）
└── README.md               # 本文件
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 注意事项

- ⚠️ 不要将 `.env` 文件提交到 git 仓库
- ⚠️ 确保 Supabase 项目的 Row Level Security (RLS) 策略已正确配置
- ⚠️ 定期备份你的 Supabase 数据库
- ![image alt](https://github.com/Misaka-git/Ziyi-web-project/blob/cae6b9e43320db027b2717ca00019aeb5047c3f3/Screenshot%202026-03-26%20201912.png)
- ![image alt](https://github.com/Misaka-git/Ziyi-web-project/blob/a57bf05ab64c615e61aee84c84e7ad0e262d22ad/image.png)
- ![image alt](https://github.com/Misaka-git/Ziyi-web-project/blob/a06b392664204ece1f1db508f01ffe4e1df46d07/Screenshot%202026-03-26%20202056.png)
- 



