import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import starlight from '@astrojs/starlight'
import { prefixBaseLinks } from './src/plugins/prefix-base-links.mjs'

const site = process.env.SITE_URL ?? 'https://leroiliu.github.io'
const base = normalizeBase(process.env.BASE_PATH ?? '/blog')

const description =
  'Leroi 的个人文档站，整理业务服务、历史技术文章、前端、PHP、Go、物联网、数据库、运维和开发常见问题。'

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  markdown: {
    processor: unified({
      remarkPlugins: [[prefixBaseLinks, { base }]],
    }),
  },
  integrations: [
    starlight({
      title: 'Leroi Docs',
      description,
      favicon: '/favicon.svg',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'Leroi Docs',
      },
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/LeroiLiu/blog',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/LeroiLiu/blog/edit/master/',
      },
      customCss: ['./src/styles/custom.css'],
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 3,
      },
      lastUpdated: true,
      pagination: true,
      credits: false,
      head: [
        { tag: 'meta', attrs: { name: 'author', content: 'Leroi' } },
        { tag: 'meta', attrs: { name: 'robots', content: 'index,follow' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0f766e' } },
        {
          tag: 'meta',
          attrs: {
            name: 'keywords',
            content:
              'Leroi, Astro, Starlight, 技术文档, PHP, ThinkPHP, Go, Vue, 小程序, MySQL, MQTT, Arduino, Docker, Kubernetes, Git, 运维, AI产品',
          },
        },
      ],
      sidebar: [
        {
          label: '开始',
          items: [
            { slug: 'index', label: '首页' },
            { slug: 'documents', label: '文档库' },
            { slug: 'articles', label: '技术分类' },
            { slug: 'services', label: '业务服务' },
            { slug: 'resume', label: '个人简历' },
            { slug: 'faq', label: '常见问题' },
            { slug: 'contributing', label: '贡献内容' },
          ],
        },
        {
          label: '前端',
          collapsed: true,
          items: [{ autogenerate: { directory: 'frontend' } }],
        },
        {
          label: '后端与语言',
          collapsed: true,
          items: [
            {
              label: '后端基础',
              items: [{ autogenerate: { directory: 'backend' } }],
            },
            {
              label: 'PHP 与 ThinkPHP',
              items: [{ autogenerate: { directory: 'php' } }],
            },
            {
              label: 'Go 与 Gin',
              items: [{ autogenerate: { directory: 'go' } }],
            },
          ],
        },
        {
          label: '数据与运维',
          collapsed: true,
          items: [
            {
              label: '数据库',
              items: [{ autogenerate: { directory: 'database' } }],
            },
            {
              label: '监控日志',
              items: [{ autogenerate: { directory: 'observability' } }],
            },
            {
              label: '运维部署',
              items: [{ autogenerate: { directory: 'ops' } }],
            },
          ],
        },
        {
          label: '物联网与视觉',
          collapsed: true,
          items: [
            {
              label: '物联网与 MQTT',
              items: [{ autogenerate: { directory: 'iot' } }],
            },
            {
              label: '视觉与图像',
              items: [{ autogenerate: { directory: 'vision' } }],
            },
          ],
        },
        {
          label: '工具与协作',
          collapsed: true,
          items: [
            {
              label: 'Git',
              items: [{ autogenerate: { directory: 'git' } }],
            },
            {
              label: '开发工具',
              items: [{ autogenerate: { directory: 'tools' } }],
            },
          ],
        },
        {
          label: '安全与逆向',
          collapsed: true,
          items: [{ autogenerate: { directory: 'security' } }],
        },
        {
          label: '技术博客归档',
          collapsed: true,
          items: [{ autogenerate: { directory: 'blog', collapsed: true } }],
        },
      ],
    }),
  ],
})

function normalizeBase(value) {
  if (!value || value === '/') return '/'
  return `/${value.replace(/^\/+|\/+$/g, '')}`
}
