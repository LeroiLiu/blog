import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://leroiliu.github.io",
    title: "Leroi",
    description:
      "Leroi 的个人技术博客，记录 PHP、Go、前端、物联网、数据库、运维与 AI 产品实践。",
    author: "刘立陈",
    profile: "https://leroiliu.github.io/blog/resume/",
    ogImage: "favicon.svg",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 10,
    perIndex: 6,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/LeroiLiu/blog/edit/codex/astropaper-blog/",
    },
    search: "pagefind",
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/LeroiLiu/blog",
      linkTitle: "在 GitHub 查看 Leroi 的项目",
    },
    {
      name: "mail",
      url: "mailto:leroiliu1995@gmail.com",
      linkTitle: "发送邮件给刘立陈",
    },
  ],
  shareLinks: [
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail", url: "mailto:?subject=推荐阅读&body=" },
  ],
});
