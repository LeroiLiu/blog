export interface NavItem {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export const SITE = {
  url: "https://leroiliu.github.io",
  title: "Leroi",
  titleMark: "墨",
  tagline: "技术、产品与实践记录",
  description:
    "Leroi 的个人技术博客，记录 PHP、Go、前端、物联网、数据库、运维与 AI 产品实践。",
  lang: "zh-CN",
  locale: "zh_CN",
  defaultOgImage: "/favicon.svg",
} as const;

export const AUTHOR = {
  name: "刘立陈",
  url: "https://leroiliu.github.io/blog/resume/",
  bio: "产品技术负责人，长期参与软件开发、软硬件协作、团队管理与 AI 产品实践。",
} as const;

export const NAV: NavItem[] = [
  { label: "首页", href: "/" },
  { label: "文档", href: "/documents/" },
  { label: "博客", href: "/blog/" },
  { label: "标签", href: "/tags/" },
  { label: "简历", href: "/resume/" },
];

export const SOCIAL: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/LeroiLiu/blog" },
];

export const BLOG = {
  postsPerPage: 10,
  postsOnHome: 5,
  wordsPerMinute: 300,
  showReadingTime: true,
  showTableOfContents: true,
  tocMinHeadings: 3,
} as const;

export const INK = {
  hero: true,
  divider: true,
  strength: 0.85,
  autoFlow: true,
} as const;

// 中文文章暂不生成 Sumi 的拉丁字体社交卡片。
export const OG = {
  enabled: false,
  width: 1200,
  height: 630,
} as const;
