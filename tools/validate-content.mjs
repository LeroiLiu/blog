import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import frontMatter from "hexo-front-matter";

const postsDir = path.resolve("source/_posts");
const sourceDir = path.resolve("source");
const expectedCategories = new Set([
  "后端开发",
  "前端开发",
  "数据库与存储",
  "服务器与运维",
  "架构与云原生",
  "物联网与机器人",
  "开发工具与效率",
  "计算机基础",
  "产品与行业观察",
]);
const errors = [];
const seenIds = new Set();
const referencedAssets = new Set();
const postFiles = await listMarkdownFiles(postsDir);

for (const file of postFiles) {
  const relativeFile = path.relative(process.cwd(), file);
  const id = path.basename(file, ".md");
  const raw = await fs.readFile(file, "utf8");
  let parsed;

  try {
    parsed = frontMatter.parse(raw);
  } catch (error) {
    errors.push(`${relativeFile}: Front Matter 无法解析：${error.message}`);
    continue;
  }

  if (!/^\d+$/.test(id)) errors.push(`${relativeFile}: 文件名必须是数字文章 ID`);
  if (seenIds.has(id)) errors.push(`${relativeFile}: 文章 ID ${id} 重复`);
  seenIds.add(id);

  if (typeof parsed.title !== "string" || !parsed.title.trim()) errors.push(`${relativeFile}: title 必须是非空字符串`);
  if (typeof parsed.description !== "string" || !parsed.description.trim()) errors.push(`${relativeFile}: description 必须是非空字符串`);
  if (parsed.excerpt !== parsed.description) errors.push(`${relativeFile}: excerpt 应与 description 保持一致`);
  if (!isValidDate(parsed.date)) errors.push(`${relativeFile}: date 无效`);
  if (!Array.isArray(parsed.categories) || parsed.categories.length !== 1) {
    errors.push(`${relativeFile}: categories 必须是只含一个主分类的数组`);
  } else if (!expectedCategories.has(String(parsed.categories[0]))) {
    errors.push(`${relativeFile}: 未知分类 ${String(parsed.categories[0])}`);
  }
  if (!Array.isArray(parsed.tags) || parsed.tags.length < 2 || parsed.tags.length > 5) {
    errors.push(`${relativeFile}: tags 必须是包含 2–5 个标签的数组`);
  } else if (new Set(parsed.tags.map(String)).size !== parsed.tags.length) {
    errors.push(`${relativeFile}: tags 不应包含重复标签`);
  }
  if (Object.hasOwn(parsed, "category")) errors.push(`${relativeFile}: 仍在使用旧的 category 字段`);

  const content = parsed._content ?? "";
  if (!content.trim()) errors.push(`${relativeFile}: 正文为空`);
  validateFences(content, relativeFile);

  const searchableContent = stripFencedCode(content);
  if (/\/blog\/(?:php|frontend|database|ops|architecture|algorithm|tools|other)\/\d+\/?/.test(searchableContent)) {
    errors.push(`${relativeFile}: 含有迁移前的文章链接`);
  }
  if (/\]\(\/images\//.test(searchableContent)) {
    errors.push(`${relativeFile}: 图片路径缺少 /blog 基础路径`);
  }

  for (const assetPath of findLocalAssets(searchableContent)) {
    referencedAssets.add(assetPath);
    const sourcePath = assetPath.replace(/^\/blog\//, "/");
    const fullPath = path.join(sourceDir, sourcePath.replace(/^\//, ""));
    try {
      const stat = await fs.stat(fullPath);
      if (!stat.isFile()) errors.push(`${relativeFile}: 资源不是文件 ${assetPath}`);
    } catch {
      errors.push(`${relativeFile}: 本地资源不存在 ${assetPath}`);
    }
  }
}

if (postFiles.length !== 94) errors.push(`文章数量应为 94，实际为 ${postFiles.length}`);

if (errors.length) {
  console.error(`内容检查失败，共 ${errors.length} 项：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`内容检查通过：${postFiles.length} 篇文章，${referencedAssets.size} 个正文资源引用。`);

function isValidDate(value) {
  if (value instanceof Date) return !Number.isNaN(value.valueOf());
  if (typeof value !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(value);
}

function validateFences(content, relativeFile) {
  let openFence = null;
  const lines = content.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^ {0,3}(`{3,}|~{3,})/);
    if (!match) continue;
    const marker = match[1];
    if (!openFence) openFence = { char: marker[0], length: marker.length, line: index + 1 };
    else if (marker[0] === openFence.char && marker.length >= openFence.length) openFence = null;
  }

  if (openFence) errors.push(`${relativeFile}:${openFence.line}: 代码围栏未闭合`);
}

function stripFencedCode(content) {
  let openFence = null;
  return content
    .split("\n")
    .map(line => {
      const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (match) {
        const marker = match[1];
        if (!openFence) openFence = { char: marker[0], length: marker.length };
        else if (marker[0] === openFence.char && marker.length >= openFence.length) openFence = null;
        return "";
      }
      return openFence ? "" : line;
    })
    .join("\n");
}

function findLocalAssets(content) {
  const assets = [];
  const patterns = [
    /!\[[^\]]*\]\((\/[^\s)]+)(?:\s+["'][^"']*["'])?\)/g,
    /<img\b[^>]*\bsrc=["'](\/[^"']+)["'][^>]*>/gi,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      if (match[1].startsWith("/blog/images/") || match[1].startsWith("/blog/styles/")) {
        assets.push(decodeURIComponent(match[1].split(/[?#]/, 1)[0]));
      }
    }
  }
  return assets;
}

async function listMarkdownFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async entry => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listMarkdownFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
    }),
  );
  return nestedFiles.flat().sort();
}
