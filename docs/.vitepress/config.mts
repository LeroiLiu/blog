import { defineConfig } from 'vitepress'
import { blogSidebar } from './blog-sidebar'

const siteName = 'Leroi Docs'
const description = 'Leroi 的个人文档站，整理业务服务、历史技术文章、前端、TypeScript、Vite、Canvas、Konva.js、Fabric.js、Vue、后台管理模板、vue-admin-template、vue-element-admin、mall-admin-web、Geeker Admin、iView UI v4、iview-admin、uni-app、uView UI、vk-uview-ui、uview-plus、ColorUI、Tailwind CSS、UnoCSS、微信小程序、支付宝小程序、抖音小程序、Electron、Element UI、PHP、PHP 版本演进、PHP 5、PHP 7、PHP 8、ThinkPHP、ThinkPHP 8 高并发、EasyWeChat、微擎、Swoole、Go、Gin、Lua、WebSocket、HTTP 轮询任务、OpenCV、SLAM、MQTT、MQTT 消息积压、EMQX、Mosquitto、Arduino、ROS 2、OpenWrt、Auto.js、逆向基础、Git、SSH、Nginx、Apache、Docker、Kubernetes、OpenList、AList、Cloudflare Tunnel、ngrok、MySQL、MySQL 慢查询、IP 信息查询 API、纯真 IP 库 QQWry、ip2region、IP数据云、IPinfo、InfluxDB、Elastic Stack、ELK、Grafana、Loki 和开发常见问题。'
const base = process.env.BASE_PATH ?? '/'
const siteUrl = process.env.SITE_URL ?? 'https://example.com'

export default defineConfig({
  lang: 'zh-CN',
  title: siteName,
  description,
  base,
  cleanUrls: true,
  lastUpdated: true,

  sitemap: {
    hostname: siteUrl
  },

  head: [
    ['meta', { name: 'author', content: 'Leroi' }],
    ['meta', { name: 'robots', content: 'index,follow' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'keywords', content: 'Leroi, 网站开发, 小程序开发, 微信小程序, 支付宝小程序, 抖音小程序, APP开发, 博客归档, 历史技术文章, TypeScript, TSConfig, Vite, Vite报错, Canvas, Konva.js, Fabric.js, Vue, 后台管理模板, vue-admin-template, vue-element-admin, mall-admin-web, Geeker Admin, iView UI v4, View UI, iview-admin, uni-app, uView UI, vk-uview-ui, uview-plus, ColorUI, Tailwind CSS, UnoCSS, Electron, Element UI, Element Plus, EasyWeChat, 微擎, Gin, ThinkPHP, ThinkPHP8高并发, Swoole, PHP开发, PHP版本演进, PHP5, PHP7, PHP8, PHP8.5, PHP升级, Go开发, Lua, WebSocket, HTTP轮询任务, PHP定时任务, crontab定时任务, OpenCV, SLAM, 视觉SLAM, 激光SLAM, VIO, 图像处理, 计算机视觉, MQTT, MQTT消息积压, EMQX, EMQX消息积压, Mosquitto, Arduino, ROS 2, ROS快速入门, OpenWrt, Auto.js, 逆向基础, Git操作, SSH密钥, Linux命令, Nginx配置, Apache配置, LNMP, 1Panel, 宝塔面板, OpenList, AList, Cloudflare Tunnel, ngrok, 内网穿透, Docker运维, Kubernetes, K8s, MySQL安装, MySQL索引, MySQL慢查询, EXPLAIN, 慢SQL, IP信息查询API, IP归属地, 纯真IP库, QQWry, ip2region, IP数据云, IPinfo, Ping0, InfluxDB, Elastic Stack, ELK, Elasticsearch, Logstash, Kibana, Grafana, Loki, 日志监控, 可观测性, MAMP, XAMPP, 运维命令, MinIO, rclone, 开发问题咨询' }]
  ],

  themeConfig: {
    siteTitle: 'Leroi Docs',

    nav: [
      { text: '文档', link: '/documents/' },
      { text: '技术博客', link: '/blog/' },
      { text: '业务服务', link: '/services' },
      {
        text: '前端',
        items: [
          {
            text: '基础',
            items: [
              { text: '前端总览', link: '/frontend/' },
              { text: 'Vue', link: '/frontend/vue' },
              { text: 'TypeScript', link: '/frontend/typescript' },
              { text: 'Vite', link: '/frontend/vite' }
            ]
          },
          {
            text: '图形与跨端',
            items: [
              { text: 'Canvas', link: '/frontend/canvas' },
              { text: 'Konva.js', link: '/frontend/konva' },
              { text: 'Fabric.js', link: '/frontend/fabric' },
              { text: 'uni-app', link: '/frontend/uni-app' },
              { text: '小程序问题', link: '/frontend/wechat-miniprogram-issues' }
            ]
          },
          {
            text: '组件与后台',
            items: [
              { text: '后台模板', link: '/frontend/admin-templates' },
              { text: 'Element UI', link: '/frontend/element-ui-2' },
              { text: 'Element Plus', link: '/frontend/element-plus' },
              { text: 'Tailwind CSS', link: '/frontend/tailwindcss' },
              { text: 'UnoCSS', link: '/frontend/unocss' }
            ]
          }
        ]
      },
      {
        text: '后端',
        items: [
          {
            text: 'PHP',
            items: [
              { text: '后端总览', link: '/backend/' },
              { text: 'PHP 总览', link: '/php/' },
              { text: 'PHP 版本演进', link: '/php/php-version-history' },
              { text: 'ThinkPHP 8.x', link: '/php/thinkphp-8-x' },
              { text: 'ThinkPHP 8 高并发', link: '/php/thinkphp8-high-concurrency' },
              { text: 'EasyWeChat', link: '/php/easywechat' },
              { text: '微擎', link: '/php/weengine' },
              { text: 'Swoole', link: '/php/swoole' }
            ]
          },
          {
            text: 'Go 与通信',
            items: [
              { text: 'Go 总览', link: '/go/' },
              { text: 'Gin', link: '/go/gin-guide' },
              { text: 'HTTP 轮询任务', link: '/backend/http-cron-polling' },
              { text: 'WebSocket', link: '/backend/websocket' },
              { text: 'Lua', link: '/backend/lua' }
            ]
          }
        ]
      },
      {
        text: '数据库',
        items: [
          { text: '数据库总览', link: '/database/' },
          { text: 'MySQL 安装与测试', link: '/database/mysql-install-test' },
          { text: 'MySQL 索引', link: '/database/mysql-indexes' },
          { text: 'MySQL 慢查询', link: '/database/mysql-slow-query' },
          { text: 'MySQL join', link: '/database/mysql-join' },
          { text: 'InfluxDB', link: '/observability/influxdb' }
        ]
      },
      {
        text: '运维',
        items: [
          {
            text: '服务器',
            items: [
              { text: '运维总览', link: '/ops/' },
              { text: 'Linux 命令', link: '/ops/linux-commands' },
              { text: 'SSH 密钥', link: '/ops/ssh-keys' },
              { text: 'Nginx', link: '/ops/nginx' },
              { text: 'Apache', link: '/ops/apache' }
            ]
          },
          {
            text: '部署与面板',
            items: [
              { text: 'Docker', link: '/ops/docker' },
              { text: 'Kubernetes', link: '/ops/kubernetes' },
              { text: 'LNMP', link: '/ops/lnmp' },
              { text: '1Panel', link: '/ops/onepanel' },
              { text: '宝塔面板', link: '/ops/baota' }
            ]
          },
          {
            text: '存储与穿透',
            items: [
              { text: 'OpenList/AList', link: '/ops/openlist-alist' },
              { text: 'Cloudflare Tunnel', link: '/ops/cloudflare-tunnel' },
              { text: '内网穿透/ngrok', link: '/ops/intranet-tunnel-ngrok' },
              { text: 'MinIO', link: '/ops/minio' },
              { text: 'rclone', link: '/ops/rclone' }
            ]
          }
        ]
      },
      {
        text: '更多',
        items: [
          {
            text: '专题',
            items: [
              { text: '技术分类', link: '/articles/' },
              { text: 'Git', link: '/git/' },
              { text: '物联网/MQTT', link: '/iot/' },
              { text: '视觉与图像', link: '/vision/' },
              { text: '监控日志', link: '/observability/' }
            ]
          },
          {
            text: '工具与帮助',
            items: [
              { text: '开发工具', link: '/tools/' },
              { text: 'IP 信息查询 API', link: '/tools/ip-info-api' },
              { text: '安全与逆向', link: '/security/' },
              { text: 'FAQ', link: '/faq/' }
            ]
          }
        ]
      }
    ],

    sidebar: {
      '/blog/': blogSidebar,
      '/articles/': [
        {
          text: '技术分类',
          items: [
            { text: '分类总览', link: '/articles/' },
            { text: '前端', link: '/frontend/' },
            { text: '后端', link: '/backend/' },
            { text: 'PHP', link: '/php/' },
            { text: 'Go', link: '/go/' },
            { text: 'Git', link: '/git/' },
            { text: '运维', link: '/ops/' },
            { text: '数据库', link: '/database/' },
            { text: '视觉与图像', link: '/vision/' },
            { text: '监控日志', link: '/observability/' },
            { text: '物联网/MQTT', link: '/iot/' },
            { text: '安全与逆向', link: '/security/' },
            { text: '开发工具', link: '/tools/' }
          ]
        }
      ],
      '/backend/': [
        {
          text: '后端',
          items: [
            { text: '后端总览', link: '/backend/' },
            { text: '后端常见报错', link: '/backend/common-errors' },
            { text: 'HTTP 轮询任务', link: '/backend/http-cron-polling' },
            { text: 'WebSocket', link: '/backend/websocket' },
            { text: 'Lua', link: '/backend/lua' },
            { text: 'PHP', link: '/php/' },
            { text: 'PHP 版本演进', link: '/php/php-version-history' },
            { text: 'Go', link: '/go/' },
            { text: 'Git', link: '/git/' },
            { text: '数据库', link: '/database/' },
            { text: '运维', link: '/ops/' }
          ]
        },
        {
          text: '框架',
          items: [
            { text: 'EasyWeChat', link: '/php/easywechat' },
            { text: '微擎', link: '/php/weengine' },
            { text: 'ThinkPHP 8.x', link: '/php/thinkphp-8-x' },
            { text: 'Swoole', link: '/php/swoole' },
            { text: 'Gin 使用指南', link: '/go/gin-guide' }
          ]
        }
      ],
      '/frontend/': [
        {
          text: '前端',
          items: [
            { text: '前端总览', link: '/frontend/' },
            { text: 'Vue 总览', link: '/frontend/vue' },
            { text: 'Vue 2 常见问题', link: '/frontend/vue-2' },
            { text: 'Vue 3 常见问题', link: '/frontend/vue-3' },
            { text: 'TypeScript', link: '/frontend/typescript' },
            { text: 'Vite', link: '/frontend/vite' }
          ]
        },
        {
          text: 'Canvas 与图形',
          items: [
            { text: 'Canvas 常见问题', link: '/frontend/canvas' },
            { text: 'Konva.js', link: '/frontend/konva' },
            { text: 'Fabric.js', link: '/frontend/fabric' }
          ]
        },
        {
          text: '后台管理模板',
          items: [
            { text: '后台模板选型', link: '/frontend/admin-templates' },
            { text: 'vue-element-admin', link: '/frontend/vue-element-admin' },
            { text: 'mall-admin-web', link: '/frontend/mall-admin-web' },
            { text: 'Geeker Admin', link: '/frontend/geeker-admin' },
            { text: 'iView UI v4', link: '/frontend/iview-ui-v4' },
            { text: 'iview-admin', link: '/frontend/iview-admin' }
          ]
        },
        {
          text: '跨端与小程序',
          items: [
            { text: 'uni-app 常见问题', link: '/frontend/uni-app' },
            { text: '微信小程序常见问题', link: '/frontend/wechat-miniprogram' },
            { text: '微信小程序开发问题', link: '/frontend/wechat-miniprogram-issues' },
            { text: '支付宝小程序开发问题', link: '/frontend/alipay-miniprogram-issues' },
            { text: '抖音小程序开发问题', link: '/frontend/douyin-miniprogram-issues' }
          ]
        },
        {
          text: 'uni-app UI 与样式工具',
          items: [
            { text: 'uView UI', link: '/frontend/uview-ui' },
            { text: 'vk-uview-ui', link: '/frontend/vk-uview-ui' },
            { text: 'uview-plus', link: '/frontend/uview-plus' },
            { text: 'ColorUI', link: '/frontend/colorui' },
            { text: 'Tailwind CSS', link: '/frontend/tailwindcss' },
            { text: 'UnoCSS', link: '/frontend/unocss' }
          ]
        },
        {
          text: '桌面端与 UI',
          items: [
            { text: 'Electron 常见问题', link: '/frontend/electron' },
            { text: 'Element UI 2.x', link: '/frontend/element-ui-2' },
            { text: 'Element Plus', link: '/frontend/element-plus' }
          ]
        }
      ],
      '/php/': [
        {
          text: 'PHP',
          items: [
            { text: 'PHP 总览', link: '/php/' },
            { text: 'PHP 版本演进', link: '/php/php-version-history' },
            { text: 'PHP 常见问题', link: '/php/faq' },
            { text: 'ThinkPHP 8 轮询任务', link: '/backend/http-cron-polling' },
            { text: 'ThinkPHP 8 高并发', link: '/php/thinkphp8-high-concurrency' },
            { text: 'EasyWeChat', link: '/php/easywechat' },
            { text: '微擎', link: '/php/weengine' },
            { text: 'Swoole', link: '/php/swoole' }
          ]
        },
        {
          text: 'ThinkPHP',
          items: [
            { text: 'ThinkPHP 3.2', link: '/php/thinkphp-3-2' },
            { text: 'ThinkPHP 5.0', link: '/php/thinkphp-5-0' },
            { text: 'ThinkPHP 5.1', link: '/php/thinkphp-5-1' },
            { text: 'ThinkPHP 6.x', link: '/php/thinkphp-6-x' },
            { text: 'ThinkPHP 8.x', link: '/php/thinkphp-8-x' },
            { text: 'ThinkPHP 8 高并发', link: '/php/thinkphp8-high-concurrency' }
          ]
        }
      ],
      '/go/': [
        {
          text: 'Go',
          items: [
            { text: 'Go 总览', link: '/go/' },
            { text: 'Go 常见问题', link: '/go/faq' }
          ]
        },
        {
          text: 'Gin',
          items: [
            { text: 'Gin 使用指南', link: '/go/gin-guide' },
            { text: 'Gin 1.9', link: '/go/gin-1-9' },
            { text: 'Gin 1.10', link: '/go/gin-1-10' },
            { text: 'Gin 1.11', link: '/go/gin-1-11' },
            { text: 'Gin 1.12', link: '/go/gin-1-12' }
          ]
        }
      ],
      '/documents/': [
        {
          text: '文档库',
          items: [
            { text: '文档库总览', link: '/documents/' },
            { text: '前端开发规范', link: '/documents/frontend' },
            { text: '后端接口约定', link: '/documents/backend' },
            { text: '发布与部署流程', link: '/documents/deploy' }
          ]
        }
      ],
      '/git/': [
        {
          text: 'Git 专题',
          items: [
            { text: '专题总览', link: '/git/' },
            { text: 'Git 速查表', link: '/git/cheat-sheet' },
            { text: '常见操作', link: '/git/common-commands' },
            { text: '常见问题', link: '/git/troubleshooting' },
            { text: '忽略文件权限变化', link: '/git/filemode' }
          ]
        }
      ],
      '/ops/': [
        {
          text: '运维基础',
          items: [
            { text: '专题总览', link: '/ops/' },
            { text: '常用 Linux 命令', link: '/ops/linux-commands' },
            { text: 'SSH 密钥生成与配置', link: '/ops/ssh-keys' },
            { text: 'curl/wget HTTPS 证书', link: '/ops/curl-wget-ssl' }
          ]
        },
        {
          text: 'Web 服务与面板',
          items: [
            { text: 'Nginx 配置', link: '/ops/nginx' },
            { text: 'Apache 配置', link: '/ops/apache' },
            { text: 'LNMP 一键安装', link: '/ops/lnmp' },
            { text: '1Panel 面板', link: '/ops/onepanel' },
            { text: '宝塔面板', link: '/ops/baota' }
          ]
        },
        {
          text: '容器与编排',
          items: [
            { text: 'Docker 运维', link: '/ops/docker' },
            { text: 'Kubernetes 运维', link: '/ops/kubernetes' }
          ]
        },
        {
          text: '存储与内网穿透',
          items: [
            { text: 'OpenList 与 AList', link: '/ops/openlist-alist' },
            { text: 'Cloudflare Tunnel', link: '/ops/cloudflare-tunnel' },
            { text: '内网穿透与 ngrok', link: '/ops/intranet-tunnel-ngrok' },
            { text: 'MinIO 对象存储安装', link: '/ops/minio' },
            { text: 'rclone 对象存储迁移', link: '/ops/rclone' }
          ]
        }
      ],
      '/database/': [
        {
          text: '数据库',
          items: [
            { text: '数据库总览', link: '/database/' },
            { text: 'MySQL 安装与测试', link: '/database/mysql-install-test' },
            { text: 'MySQL 索引', link: '/database/mysql-indexes' },
            { text: 'MySQL 慢查询', link: '/database/mysql-slow-query' },
            { text: 'MySQL join 图解', link: '/database/mysql-join' },
            { text: 'InfluxDB', link: '/observability/influxdb' }
          ]
        }
      ],
      '/vision/': [
        {
          text: '视觉与图像',
          items: [
            { text: '专题总览', link: '/vision/' },
            { text: 'OpenCV', link: '/vision/opencv' }
          ]
        }
      ],
      '/observability/': [
        {
          text: '监控日志',
          items: [
            { text: '专题总览', link: '/observability/' },
            { text: 'InfluxDB', link: '/observability/influxdb' },
            { text: 'Elastic Stack / ELK', link: '/observability/elastic-stack' },
            { text: 'Grafana', link: '/observability/grafana' },
            { text: 'Loki', link: '/observability/loki' }
          ]
        }
      ],
      '/iot/': [
        {
          text: '物联网基础',
          items: [
            { text: '专题总览', link: '/iot/' },
            { text: 'Arduino 基础', link: '/iot/arduino' },
            { text: 'ROS 2 快速入门', link: '/iot/ros2-quickstart' },
            { text: 'SLAM 算法', link: '/iot/slam-algorithms' },
            { text: 'OpenWrt', link: '/iot/openwrt' }
          ]
        },
        {
          text: 'MQTT 与 Broker',
          items: [
            { text: 'MQTT 基础', link: '/iot/mqtt' },
            { text: 'MQTT 消息积压', link: '/iot/mqtt-message-backlog-emqx-php' },
            { text: 'EMQX', link: '/iot/emqx' },
            { text: 'Mosquitto', link: '/iot/mosquitto' }
          ]
        }
      ],
      '/security/': [
        {
          text: '安全与逆向',
          items: [
            { text: '专题总览', link: '/security/' },
            { text: '逆向基础知识', link: '/security/reverse-engineering-basics' }
          ]
        }
      ],
      '/tools/': [
        {
          text: '本地开发环境',
          items: [
            { text: '工具总览', link: '/tools/' },
            { text: 'Mac 本地开发环境', link: '/tools/mac-local-env' },
            { text: 'MAMP', link: '/tools/mamp' },
            { text: 'XAMPP', link: '/tools/xampp' }
          ]
        },
        {
          text: '自动化与接口工具',
          items: [
            { text: 'Auto.js', link: '/tools/autojs' },
            { text: 'Auto.js 版本区别', link: '/tools/autojs-versions' },
            { text: 'Auto.js-Pro-Ext', link: '/tools/autojs-pro-ext' },
            { text: 'IP 信息查询 API', link: '/tools/ip-info-api' }
          ]
        },
        {
          text: '资料与效率工具',
          items: [
            { text: '字体字符集', link: '/tools/font-charset' },
            { text: 'Sublime 退出问题', link: '/tools/sublime-unsaved-exit' },
            { text: '工具收集', link: '/tools/useful-tools' }
          ]
        }
      ],
      '/faq/': [
        {
          text: 'FAQ',
          items: [
            { text: 'FAQ 总览', link: '/faq/' },
            { text: '常见报错', link: '/faq/common-errors' },
            { text: '开发咨询 FAQ', link: '/faq/dev-consulting' },
            { text: '部署 FAQ', link: '/faq/deploy' },
            { text: '前端 FAQ', link: '/faq/frontend' },
            { text: 'Git FAQ', link: '/faq/git' }
          ]
        }
      ],
      '/': [
        {
          text: '开始',
          items: [
            { text: '首页', link: '/' },
            { text: '文档库', link: '/documents/' },
            { text: '技术博客归档', link: '/blog/' },
            { text: '业务服务', link: '/services' },
            { text: '技术分类', link: '/articles/' },
            { text: 'FAQ', link: '/faq/' },
            { text: '贡献内容', link: '/contributing' }
          ]
        },
        {
          text: '核心技术',
          items: [
            { text: '前端总览', link: '/frontend/' },
            { text: '后端总览', link: '/backend/' },
            { text: 'PHP', link: '/php/' },
            { text: 'PHP 版本演进', link: '/php/php-version-history' },
            { text: 'Go', link: '/go/' },
            { text: '数据库', link: '/database/' },
            { text: '运维', link: '/ops/' }
          ]
        },
        {
          text: '专题',
          items: [
            { text: 'Git', link: '/git/' },
            { text: '物联网/MQTT', link: '/iot/' },
            { text: '视觉与图像', link: '/vision/' },
            { text: '监控日志', link: '/observability/' },
            { text: '开发工具', link: '/tools/' },
            { text: '安全与逆向', link: '/security/' }
          ]
        },
        {
          text: '高频入口',
          items: [
            { text: 'Vue', link: '/frontend/vue' },
            { text: 'TypeScript', link: '/frontend/typescript' },
            { text: 'Vite', link: '/frontend/vite' },
            { text: 'ThinkPHP 8 高并发', link: '/php/thinkphp8-high-concurrency' },
            { text: 'MySQL 慢查询', link: '/database/mysql-slow-query' },
            { text: 'HTTP 轮询任务', link: '/backend/http-cron-polling' },
            { text: 'Git', link: '/git/' },
            { text: 'IP 信息查询 API', link: '/tools/ip-info-api' }
          ]
        }
      ]
    },

    search: {
      provider: 'local'
    },

    outline: {
      label: '本页目录',
      level: [2, 3]
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新'
    },

    footer: {
      message: 'Leroi / 刘立陈的个人文档、业务服务与开发问题知识库。',
      copyright: 'Copyright © 2026 Leroi'
    }
  }
})
