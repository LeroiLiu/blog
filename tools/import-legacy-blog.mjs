import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import frontMatter from "hexo-front-matter";

const [, , sourceArg, targetArg = "source/_posts"] = process.argv;

if (!sourceArg) {
  console.error("用法：pnpm run import:blog -- <旧博客目录> [目标目录]");
  process.exit(1);
}

const sourceDir = path.resolve(sourceArg);
const targetDir = path.resolve(targetArg);
const fallbackDescriptions = new Map([
  ["77718943", "CSS 与 div 布局图片笔记，整理网页布局和样式实践。"],
  ["87910880", "OpenMC 系统架构图及相关组件关系记录。"],
]);
const sourceFiles = await listMarkdownFiles(sourceDir);
const articleFiles = sourceFiles.filter(file => path.basename(file) !== "index.md");

await fs.mkdir(targetDir, { recursive: true });

for (const sourceFile of articleFiles) {
  const raw = await fs.readFile(sourceFile, "utf8");
  const parsed = frontMatter.parse(raw);
  const id = path.basename(sourceFile, ".md");

  if (!/^\d+$/.test(id)) throw new Error(`文章文件名必须是数字 ID：${sourceFile}`);

  const category = parsed.category ?? parsed.categories?.[0];
  if (!parsed.title || !parsed.date || !category) {
    throw new Error(`缺少 title、date 或 category：${sourceFile}`);
  }

  const migrated = {
    title: String(parsed.title),
    description: String(parsed.description ?? fallbackDescriptions.get(id) ?? "").trim() || fallbackDescriptions.get(id),
    excerpt: String(parsed.description ?? fallbackDescriptions.get(id) ?? "").trim() || fallbackDescriptions.get(id),
    date: formatDate(parsed.date),
    categories: [String(category)],
    tags: normalizeTags(parsed.tags),
    _content: normalizeContent(parsed._content ?? ""),
  };
  const output = frontMatter.stringify(migrated, {
    prefixSeparator: true,
    lineWidth: -1,
    noRefs: true,
  });

  await fs.writeFile(path.join(targetDir, `${id}.md`), output, "utf8");
}

console.log(`已迁移 ${articleFiles.length} 篇文章到 ${path.relative(process.cwd(), targetDir)}`);

function normalizeContent(content) {
  let value = content.replaceAll("\r\n", "\n").trimStart();
  value = value.replace(
    /\]\(\/blog\/(?:php|frontend|database|ops|architecture|algorithm|tools|other)\/(\d+)\/?\)/g,
    "](/blog/posts/$1/)",
  );
  value = value.replaceAll("](/images/", "](/blog/images/");
  value = value.replace(
    /(原博客地址（CSDN）：[^\n]+\n)(?!\n<!-- more -->)/,
    "$1\n<!-- more -->\n",
  );
  value = relocateLegacyNotice(value);
  return value.endsWith("\n") ? value : `${value}\n`;
}

function relocateLegacyNotice(content) {
  const noticePattern =
    /(?:^|\n)> \*\*历史博客说明\*\*\n>\n> 本文为 Leroi 的历史博客文章，原发布于 CSDN，现迁移并重新整理到本站。\n>\n> 原博客地址（CSDN）：\[[^\]]+\]\(([^)]+)\)\n*/;
  const match = content.match(noticePattern);
  if (!match) return content;

  const article = content.replace(noticePattern, "\n").trim();
  return `${article}\n\n---\n\n本文早期发布于个人 CSDN 博客：[查看原文](${match[1]})\n`;
}

function normalizeTags(tags) {
  if (!tags) return [];
  return (Array.isArray(tags) ? tags : [tags])
    .map(tag => String(tag).trim())
    .filter(Boolean);
}

function formatDate(value) {
  if (typeof value === "string") return value;
  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) {
    throw new Error(`无效发布日期：${String(value)}`);
  }
  const pad = number => String(number).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
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
