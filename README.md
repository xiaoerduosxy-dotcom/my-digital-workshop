This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 每日 AI 最新资讯

- 修改 [选题方向、资讯来源、条数和简介长度](lib/daily-ai-news/config.ts) 后，下次生成会使用新规则。
- Vercel 在北京时间每天 08:00–08:59 内请求简报接口。上线时在项目中设置已有的 `DEEPSEEK_API_KEY`、随机生成的 `CRON_SECRET`，并连接私有 Vercel Blob 存储以提供 `BLOB_READ_WRITE_TOKEN`。已有其他用途的 Blob 存储可复用，简报保存在 `daily-ai-news/latest.json`。
- 本地在 `.env.local` 中设置前两项。简报和首页 AI 对话共用同一个 `DEEPSEEK_API_KEY`，`CRON_SECRET` 单独用来保护定时任务入口。启动网站后向 `/api/cron/daily-ai-news` 发送 GET 请求，带上 `Authorization: Bearer <CRON_SECRET>`。本地未配置 Blob 时，简报保存到被 Git 忽略的 `.daily-ai-news/latest.json`。
- 首页以北京时间为准，选满当天发布的 3 条资讯才发布一整期。生成失败或候选不足时可以当天再触发。已有简报保留在 `/ai-news`，按原文发布日期倒序展示。
- 首次上线时使用仓库中的两期已审核简报，首次成功更新后从私有 Blob 读取简报及归档。
