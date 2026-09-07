import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const outputDir = path.resolve("public");
const siteRoot = "/blog/";
const errors = [];
const requiredFiles = [
  "index.html",
  "about/index.html",
  "archives/index.html",
  "categories/index.html",
  "tags/index.html",
  "search.json",
  "atom.xml",
  "sitemap.xml",
  "favicon.svg",
  "images/brand.svg",
];

for (const relativeFile of requiredFiles) {
  if (!(await fileExists(path.join(outputDir, relativeFile)))) {
    errors.push(`缺少构建产物 ${relativeFile}`);
  }
}

const htmlFiles = (await listFiles(outputDir)).filter(file => file.endsWith(".html"));
const postFiles = htmlFiles.filter(file => /\/posts\/(?:\d+|[a-z0-9]+(?:-[a-z0-9]+)*)\/index\.html$/.test(file));
if (postFiles.length !== 203) errors.push(`应生成 203 个文章页面，实际为 ${postFiles.length}`);

for (const file of htmlFiles) {
  const relativeFile = path.relative(outputDir, file);
  const html = await fs.readFile(file, "utf8");
  const normalizedHtml = html.replaceAll("&#x2F;", "/").replaceAll("&#47;", "/");

  if (normalizedHtml.includes("/blog/blog/")) errors.push(`${relativeFile}: 含有重复的 /blog/blog/ 路径`);
  if (/<meta\s+name=["'](?:generator|hexo-theme)["']/i.test(normalizedHtml)) {
    errors.push(`${relativeFile}: 仍公开博客框架或主题元信息`);
  }
  if (/[?&]v=\d+\.\d+\.\d+(?:-[^&"'\s]+)?/i.test(normalizedHtml)) {
    errors.push(`${relativeFile}: 静态资源 URL 仍公开主题版本号`);
  }

  const attributePattern = /\b(?:href|src|data-src)="([^"]+)"/g;
  for (const match of normalizedHtml.matchAll(attributePattern)) {
    const url = match[1];
    if (!url.startsWith("/")) continue;
    if (!url.startsWith(siteRoot)) {
      errors.push(`${relativeFile}: 站内绝对路径缺少 ${siteRoot} 前缀：${url}`);
      continue;
    }

    const localPath = decodeURIComponent(url.slice(siteRoot.length).split(/[?#]/, 1)[0]);
    if (!localPath) continue;
    if (!(await outputPathExists(localPath))) {
      errors.push(`${relativeFile}: 链接目标不存在：${url}`);
    }
  }
}

const laravelExample = await fs.readFile(path.join(outputDir, "posts/83308177/index.html"), "utf8");
const laravelText = laravelExample.replace(/<[^>]+>/g, "");
if (!laravelText.includes("{{ $name }}")) {
  errors.push("Laravel 模板示例中的 {{ $name }} 未被原样保留");
}

if (errors.length) {
  console.error(`构建产物检查失败，共 ${errors.length} 项：`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  if (errors.length > 100) console.error(`- 另有 ${errors.length - 100} 项未显示`);
  process.exit(1);
}

console.log(`构建产物检查通过：${postFiles.length} 个文章页面，${htmlFiles.length} 个 HTML 页面。`);

async function outputPathExists(relativePath) {
  const directPath = path.join(outputDir, relativePath);
  if (await fileExists(directPath)) return true;
  return fileExists(path.join(directPath, "index.html"));
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async entry => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );
  return nestedFiles.flat();
}
