import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import frontMatter from "hexo-front-matter";

const sourceBranch = "master";
const postsDir = path.resolve("source/_posts");
const sourceDir = path.resolve("source");
const expectedArticleCount = 123;
const expectedAssetCount = 87;

const mergedRouteBySourcePath = new Map([
  ["docs/documents/backend.md", "/blog/posts/engineering-collaboration-standards/"],
  ["docs/documents/frontend.md", "/blog/posts/engineering-collaboration-standards/"],
  ["docs/documents/deploy.md", "/blog/posts/engineering-collaboration-standards/"],
  ["docs/go/gin-1-9.md", "/blog/posts/go-gin-version-guide/"],
  ["docs/go/gin-1-10.md", "/blog/posts/go-gin-version-guide/"],
  ["docs/go/gin-1-11.md", "/blog/posts/go-gin-version-guide/"],
  ["docs/go/gin-1-12.md", "/blog/posts/go-gin-version-guide/"],
  ["docs/php/thinkphp-3-2.md", "/blog/posts/php-thinkphp-version-guide/"],
  ["docs/php/thinkphp-5-0.md", "/blog/posts/php-thinkphp-version-guide/"],
  ["docs/php/thinkphp-5-1.md", "/blog/posts/php-thinkphp-version-guide/"],
  ["docs/php/thinkphp-6-x.md", "/blog/posts/php-thinkphp-version-guide/"],
  ["docs/php/thinkphp-8-x.md", "/blog/posts/php-thinkphp-version-guide/"],
  ["docs/frontend/vue.md", "/blog/posts/frontend-vue/"],
  ["docs/frontend/vue-2.md", "/blog/posts/frontend-vue/"],
  ["docs/frontend/vue-3.md", "/blog/posts/frontend-vue/"],
  ["docs/frontend/wechat-miniprogram.md", "/blog/posts/frontend-wechat-miniprogram-issues/"],
  ["docs/frontend/wechat-miniprogram-issues.md", "/blog/posts/frontend-wechat-miniprogram-issues/"],
  ["docs/git/cheat-sheet.md", "/blog/posts/git-cheat-sheet/"],
  ["docs/git/common-commands.md", "/blog/posts/git-cheat-sheet/"],
  ["docs/faq/git.md", "/blog/posts/git-troubleshooting/"],
  ["docs/git/troubleshooting.md", "/blog/posts/git-troubleshooting/"],
]);

const categoryBySection = {
  backend: "后端开发",
  database: "数据库与存储",
  documents: "开发工具与效率",
  faq: "开发工具与效率",
  frontend: "前端开发",
  git: "开发工具与效率",
  go: "后端开发",
  iot: "物联网与机器人",
  observability: "服务器与运维",
  ops: "服务器与运维",
  php: "后端开发",
  security: "安全与逆向工程",
  tools: "开发工具与效率",
  vision: "计算机视觉",
  services: "产品与行业观察",
};

const fallbackTags = {
  backend: ["后端开发", "服务端"],
  database: ["数据库", "SQL"],
  documents: ["软件工程", "开发规范"],
  faq: ["故障排查", "开发指南"],
  frontend: ["前端开发", "Web 开发"],
  git: ["Git", "版本控制"],
  go: ["Go", "后端开发"],
  iot: ["物联网", "嵌入式开发"],
  observability: ["可观测性", "系统监控"],
  ops: ["服务器运维", "部署"],
  php: ["PHP", "后端开发"],
  security: ["逆向工程", "安全分析"],
  tools: ["开发工具", "效率工具"],
  vision: ["OpenCV", "计算机视觉"],
  services: ["技术服务", "产品开发"],
};

const tagRules = [
  [/(?:thinkphp|\btp\s*[3568]\b)/i, "ThinkPHP"],
  [/easywechat/i, "EasyWeChat"],
  [/微擎|weengine/i, "微擎"],
  [/swoole/i, "Swoole"],
  [/\bphp\b/i, "PHP"],
  [/\bgin\b/i, "Gin"],
  [/\bgo(?:lang)?\b/i, "Go"],
  [/\blua\b/i, "Lua"],
  [/websocket/i, "WebSocket"],
  [/\bhttp\b/i, "HTTP"],
  [/mysql/i, "MySQL"],
  [/typescript/i, "TypeScript"],
  [/vue-element-admin/i, "vue-element-admin"],
  [/element\s*plus/i, "Element Plus"],
  [/element\s*ui/i, "Element UI"],
  [/iview/i, "iView"],
  [/uview-plus/i, "uview-plus"],
  [/uview/i, "uView UI"],
  [/colorui/i, "ColorUI"],
  [/tailwind/i, "Tailwind CSS"],
  [/unocss/i, "UnoCSS"],
  [/uni-app|uniapp/i, "uni-app"],
  [/微信小程序/i, "微信小程序"],
  [/支付宝小程序/i, "支付宝小程序"],
  [/抖音小程序/i, "抖音小程序"],
  [/electron/i, "Electron"],
  [/fabric(?:\.js)?/i, "Fabric.js"],
  [/konva(?:\.js)?/i, "Konva.js"],
  [/canvas/i, "Canvas"],
  [/\bvue(?:\.js)?\b/i, "Vue"],
  [/\bvite\b/i, "Vite"],
  [/\bgit\b/i, "Git"],
  [/linux/i, "Linux"],
  [/nginx/i, "Nginx"],
  [/apache/i, "Apache"],
  [/docker/i, "Docker"],
  [/kubernetes|\bk8s\b/i, "Kubernetes"],
  [/\blnmp\b/i, "LNMP"],
  [/minio/i, "MinIO"],
  [/rclone/i, "Rclone"],
  [/\bssh\b/i, "SSH"],
  [/cloudflare\s*tunnel/i, "Cloudflare Tunnel"],
  [/ngrok|内网穿透/i, "内网穿透"],
  [/宝塔/i, "宝塔面板"],
  [/1panel/i, "1Panel"],
  [/openlist|alist/i, "OpenList"],
  [/ssl|tls|证书/i, "SSL/TLS"],
  [/arduino/i, "Arduino"],
  [/esp8266/i, "ESP8266"],
  [/\bmqtt\b/i, "MQTT"],
  [/emqx/i, "EMQX"],
  [/mosquitto/i, "Mosquitto"],
  [/openwrt/i, "OpenWrt"],
  [/ros\s*2/i, "ROS 2"],
  [/\bslam\b/i, "SLAM"],
  [/elastic(?:search|\s*stack)|\belk\b/i, "Elastic Stack"],
  [/grafana/i, "Grafana"],
  [/influxdb/i, "InfluxDB"],
  [/\bloki\b/i, "Loki"],
  [/frida/i, "Frida"],
  [/ghidra/i, "Ghidra"],
  [/radare2|\br2\b/i, "radare2"],
  [/wireshark/i, "Wireshark"],
  [/\bios\b|iphone|ipad/i, "iOS"],
  [/android/i, "Android"],
  [/微信|wechat/i, "微信"],
  [/抖音|douyin/i, "抖音"],
  [/小红书|\bxhs\b/i, "小红书"],
  [/url\s*scheme/i, "URL Scheme"],
  [/auto\.?(?:js)?/i, "Auto.js"],
  [/macos|\bmac\b/i, "macOS"],
  [/mamp/i, "MAMP"],
  [/xampp/i, "XAMPP"],
  [/sublime/i, "Sublime Text"],
  [/opencv/i, "OpenCV"],
];

const articlePaths = listGitFiles("docs").filter(isArticlePath);
if (articlePaths.length !== expectedArticleCount) {
  throw new Error(`master 分支待迁移文章应为 ${expectedArticleCount} 篇，实际为 ${articlePaths.length} 篇`);
}

const routeBySourcePath = new Map(
  articlePaths.map(sourcePath => [
    sourcePathToRoute(sourcePath),
    mergedRouteBySourcePath.get(sourcePath) ?? `/blog/posts/${sourcePathToSlug(sourcePath)}/`,
  ]),
);

await fs.mkdir(postsDir, { recursive: true });

const standaloneArticlePaths = articlePaths.filter(sourcePath => !mergedRouteBySourcePath.has(sourcePath));

for (const sourcePath of standaloneArticlePaths) {
  const raw = readGitText(sourcePath);
  const parsed = frontMatter.parse(raw);
  const title = String(parsed.title ?? "").trim();
  const description = String(parsed.description ?? "").trim();
  if (!title || !description) throw new Error(`${sourcePath}: 缺少 title 或 description`);

  const section = sourcePathToSection(sourcePath);
  const content = transformContent(parsed._content ?? "", title);
  const post = {
    title,
    description,
    excerpt: description,
    date: readCreatedDate(sourcePath),
    categories: [categoryBySection[section]],
    tags: createTags(title, description, section),
    _content: `<!-- more -->\n\n${content.trim()}\n`,
  };
  const outputPath = path.join(postsDir, `${sourcePathToSlug(sourcePath)}.md`);
  await fs.writeFile(
    outputPath,
    frontMatter.stringify(post, { prefixSeparator: true, lineWidth: -1, noRefs: true }),
    "utf8",
  );
}

const assetPaths = listGitFiles("docs/public/images").filter(sourcePath =>
  /^docs\/public\/images\/(?:articles|security)\//.test(sourcePath),
);
if (assetPaths.length !== expectedAssetCount) {
  throw new Error(`master 分支文章资源应为 ${expectedAssetCount} 个，实际为 ${assetPaths.length} 个`);
}

for (const sourcePath of assetPaths) {
  const outputPath = path.join(sourceDir, sourcePath.replace(/^docs\/public\//, ""));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, readGitBuffer(sourcePath));
}

console.log(
  `已从 ${sourceBranch} 导入 ${standaloneArticlePaths.length} 篇独立文章和 ${assetPaths.length} 个资源文件，` +
    `${mergedRouteBySourcePath.size} 篇源文档由合并文章接管。`,
);

function isArticlePath(sourcePath) {
  return (
    sourcePath.endsWith(".md") &&
    !sourcePath.startsWith("docs/blog/") &&
    !sourcePath.endsWith("/index.md") &&
    !["docs/resume.md", "docs/contributing.md"].includes(sourcePath)
  );
}

function sourcePathToSection(sourcePath) {
  if (sourcePath === "docs/services.md") return "services";
  return sourcePath.split("/")[1];
}

function sourcePathToSlug(sourcePath) {
  const relativePath = sourcePath.replace(/^docs\//, "").replace(/\.md$/, "");
  return relativePath.replaceAll("/", "-");
}

function sourcePathToRoute(sourcePath) {
  return `/${sourcePath.replace(/^docs\//, "").replace(/\.md$/, "")}`;
}

function transformContent(content, title) {
  let transformed = content.replaceAll("\r\n", "\n");
  transformed = removeDuplicateTitle(transformed, title);
  transformed = labelBareFences(transformed);
  transformed = convertVitePressContainers(transformed);
  transformed = rewriteLocalPaths(transformed);
  return transformed;
}

function removeDuplicateTitle(content, title) {
  const lines = content.split("\n");
  const headingIndex = lines.findIndex(line => line.trim());
  if (headingIndex < 0) return content;
  const match = lines[headingIndex].match(/^#\s+(.+?)\s*$/);
  if (match && normalizeText(match[1]) === normalizeText(title)) lines.splice(headingIndex, 1);
  return lines.join("\n");
}

function labelBareFences(content) {
  const lines = content.split("\n");
  let fence = null;
  return lines
    .map(line => {
      const match = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
      if (!match) return line;
      const marker = match[2];
      if (!fence) {
        fence = { char: marker[0], length: marker.length };
        return match[3].trim() ? line : `${match[1]}${marker}text`;
      }
      if (marker[0] === fence.char && marker.length >= fence.length) fence = null;
      return line;
    })
    .join("\n");
}

function convertVitePressContainers(content) {
  const labels = { info: "说明", tip: "提示", warning: "注意", danger: "警告", details: "详细信息" };
  const lines = content.split("\n");
  const result = [];
  const containers = [];

  for (const line of lines) {
    const marker = line.match(/^\s*(:{3,})\s*(.*?)\s*$/);
    if (marker && !marker[2] && containers.length) {
      containers.pop();
      if (!containers.length && result.at(-1) !== "") result.push("");
      continue;
    }
    if (marker && marker[2]) {
      const [kind = "info", ...titleParts] = marker[2].split(/\s+/);
      const label = titleParts.join(" ") || labels[kind] || "说明";
      containers.push(marker[1].length);
      result.push(`${"> ".repeat(containers.length)}**${label}**`);
      continue;
    }
    if (containers.length) {
      result.push(line ? `${"> ".repeat(containers.length)}${line}` : ">".repeat(containers.length));
    } else {
      result.push(line);
    }
  }

  if (containers.length) throw new Error("发现未闭合的 VitePress 提示容器");
  return result.join("\n");
}

function rewriteLocalPaths(content) {
  const rewrite = rawUrl => {
    const match = rawUrl.match(/^([^?#]+)([?#].*)?$/);
    if (!match) return rawUrl;
    const pathname = match[1];
    const suffix = match[2] ?? "";
    if (pathname.startsWith("/images/")) return `/blog${pathname}${suffix}`;

    const legacyPost = pathname.match(/^\/blog\/(?:php|frontend|database|ops|architecture|algorithm|tools|other)\/(\d+)\/?$/);
    if (legacyPost) return `/blog/posts/${legacyPost[1]}/${suffix}`;
    if (pathname === "/git/") return `/blog/tags/Git/${suffix}`;
    if (routeBySourcePath.has(pathname)) return `${routeBySourcePath.get(pathname)}${suffix}`;
    return rawUrl;
  };

  return content
    .replace(/(\]\()([^\s)]+)([^)]*\))/g, (_, start, url, end) => `${start}${rewrite(url)}${end}`)
    .replace(/(\b(?:href|src)=["'])(\/[^"']+)(["'])/gi, (_, start, url, end) => `${start}${rewrite(url)}${end}`);
}

function createTags(title, description, section) {
  const searchable = `${title}\n${description}`;
  const tags = [];
  for (const [pattern, tag] of tagRules) {
    if (pattern.test(searchable) && !tags.includes(tag)) tags.push(tag);
    if (tags.length === 5) break;
  }
  for (const tag of fallbackTags[section]) {
    if (!tags.includes(tag)) tags.push(tag);
    if (tags.length === 5) break;
  }
  return tags.slice(0, 5);
}

function normalizeText(value) {
  return value.replace(/[*_`~]/g, "").replace(/[\s—–_()（）:：]/g, "").toLowerCase();
}

function readCreatedDate(sourcePath) {
  const output = git(["log", sourceBranch, "--diff-filter=A", "--follow", "--format=%aI", "--", sourcePath], "utf8");
  const dates = output.trim().split("\n").filter(Boolean);
  if (!dates.length) throw new Error(`${sourcePath}: 无法读取首次提交时间`);
  return dates.at(-1).replace(/\.\d{3}(?=[+-]\d{2}:\d{2}$)/, "").replace(/[+-]\d{2}:\d{2}$/, "");
}

function listGitFiles(directory) {
  return git(["ls-tree", "-r", "--name-only", sourceBranch, directory], "utf8").trim().split("\n").filter(Boolean);
}

function readGitText(sourcePath) {
  return git(["show", `${sourceBranch}:${sourcePath}`], "utf8");
}

function readGitBuffer(sourcePath) {
  return git(["show", `${sourceBranch}:${sourcePath}`]);
}

function git(args, encoding = null) {
  return execFileSync("git", args, { cwd: process.cwd(), encoding, maxBuffer: 64 * 1024 * 1024 });
}
