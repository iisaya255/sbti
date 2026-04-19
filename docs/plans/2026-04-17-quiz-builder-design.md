# SBTI 问卷设计器 — 设计文档

## 概述

在现有 SBTI 人格测试静态站基础上，整站迁移至 Next.js，新增用户自定义问卷设计与发布功能。任何访客可注册创建类 SBTI 的人格测试问卷，用户生成的页面具备完整 SEO 支持。

## 技术选型

| 层 | 选型 |
|---|---|
| 框架 | Next.js App Router (TypeScript) |
| 部署 | Vercel |
| 数据库 | Supabase PostgreSQL |
| 认证 | Supabase Auth (OAuth 社交登录) |
| 文件存储 | Supabase Storage |
| SEO | SSR + 动态 sitemap + OG meta |

## 路由结构

```
/              → 首页 (原 SBTI 测试，SSR)
/types/[code]  → 人格类型详情页 (SSG)
/create        → 问卷设计器 (需登录，CSR 为主)
/create/[id]   → 编辑已有问卷
/q/[slug]      → 用户问卷填写页 (SSR, SEO)
/q/[slug]/result → 测试结果页 (SSR, SEO)
/my            → 我的问卷管理 (需登录)
/api/*         → Vercel Serverless Functions
```

## 数据模型

### profiles
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | FK → auth.users |
| nickname | text | |
| avatar_url | text | |

### quizzes
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| author_id | uuid FK | → profiles |
| slug | text UNIQUE | URL 友好短链 |
| title | text | |
| description | text | |
| og_image | text | 分享封面图 |
| status | enum | draft / published |
| created_at | timestamp | |
| published_at | timestamp | |

### dimensions
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| quiz_id | uuid FK | → quizzes |
| code | text | 如 "S1" |
| name | text | 如 "社交能力" |
| sort_order | int | |

### questions
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| quiz_id | uuid FK | → quizzes |
| dimension_id | uuid FK | → dimensions |
| text | text | 题面 |
| sort_order | int | |

### options
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| question_id | uuid FK | → questions |
| text | text | 选项文字 |
| score | int | 对所属维度的加分 |

### personality_types
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| quiz_id | uuid FK | → quizzes |
| code | text | 如 "INTJ" |
| name | text | |
| description | text | |
| image_url | text | |
| dim_pattern | jsonb | {"S1":"H","S2":"L",...} |

### submissions
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| quiz_id | uuid FK | → quizzes |
| result_type | uuid FK | → personality_types |
| created_at | timestamp | |

## 问卷设计器流程

1. **基本信息** — 标题、描述、封面图、自定义 slug
2. **维度设计** — 添加维度（代号+名称），拖拽排序
3. **题目与选项** — 每题关联维度，2~5 选项各设分值，支持拖拽排序
4. **人格类型库** — 定义结果类型，设定维度匹配模式 (L/M/H)
5. **预览 & 发布** — 模拟答题，确认后发布

编辑实时自动保存（draft 状态）。

## 计算逻辑

与现有 SBTI 一致：
1. 每维度题目得分求和 → 映射为 L/M/H
2. 用户维度组合与 personality_types.dim_pattern 做距离匹配
3. 返回最佳匹配人格类型

## SEO 策略

- `/q/[slug]` SSR 渲染，动态生成 title/description/OG meta
- `/q/[slug]/result?type=xxx` SSR 渲染，支持社交分享
- `sitemap.ts` 动态查询所有 published 问卷生成 sitemap
- 高流量问卷启用 ISR 缓存
