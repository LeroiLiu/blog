import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import frontMatter from "hexo-front-matter";

const postsDir = path.resolve("source/_posts");
const shouldWrite = process.argv.includes("--write");
const postFiles = await listMarkdownFiles(postsDir);
const changedFiles = [];

for (const file of postFiles) {
  const raw = await fs.readFile(file, "utf8");
  const parsed = frontMatter.parse(raw);
  const formattedContent = formatContent(parsed._content ?? "", String(parsed.title ?? ""));

  if (formattedContent === parsed._content) continue;
  changedFiles.push(path.relative(process.cwd(), file));

  if (shouldWrite) {
    parsed._content = formattedContent;
    const formattedPost = frontMatter.stringify(parsed, {
      prefixSeparator: true,
      lineWidth: -1,
      noRefs: true,
    });
    await fs.writeFile(file, formattedPost, "utf8");
  }
}

if (!changedFiles.length) {
  console.log(`Markdown 排版检查通过：${postFiles.length} 篇文章。`);
} else if (shouldWrite) {
  console.log(`已统一 ${changedFiles.length}/${postFiles.length} 篇文章的 Markdown 排版。`);
} else {
  console.error(`Markdown 排版检查失败，${changedFiles.length} 篇文章需要格式化：`);
  for (const file of changedFiles) console.error(`- ${file}`);
  console.error("请运行 pnpm run format:posts 后重新检查。");
  process.exit(1);
}

function formatContent(content, title) {
  const relocatedContent = relocateLegacyNotice(content.replaceAll("\r\n", "\n"));
  const sourceLines = unwrapOverquotedContent(relocatedContent.split("\n"));
  const normalizedLines = normalizeLines(sourceLines);
  const semanticLines = normalizeSemanticBlocks(normalizedLines, title);
  const structuredLines = normalizeHeadingLevels(semanticLines, title);
  const accessibleLines = addImageDescriptions(structuredLines, title);
  const deduplicatedLines = removeAdjacentDuplicateParagraphs(accessibleLines);
  const spacedLines = normalizeBlockSpacing(deduplicatedLines);
  return `${spacedLines.join("\n").trim()}\n`;
}

function relocateLegacyNotice(content) {
  const noticePattern =
    /(?:^|\n)> \*\*历史博客说明\*\*\n>\n> 本文为 Leroi 的历史博客文章，原发布于 CSDN，现迁移并重新整理到本站。\n>\n> 原博客地址（CSDN）：\[[^\]]+\]\(([^)]+)\)\n*/;
  const match = content.match(noticePattern);
  if (!match) return content;

  const article = content.replace(noticePattern, "\n").trim();
  return `${article}\n\n---\n\n来源：本文迁移自原 CSDN 博客，已重新整理。[查看原文](${match[1]})\n`;
}

function normalizeLines(lines) {
  const normalized = [];
  let fence = null;

  for (const originalLine of lines) {
    const fenceMatch = originalLine.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const marker = fenceMatch[2];
      if (!fence) {
        fence = { char: marker[0], length: marker.length, indent: fenceMatch[1].length };
        normalized.push(`\`\`\`${normalizeFenceLanguage(fenceMatch[3])}`);
      } else if (marker[0] === fence.char && marker.length >= fence.length) {
        fence = null;
        normalized.push("```");
      } else {
        normalized.push(originalLine.trimEnd());
      }
      continue;
    }

    if (fence) {
      normalized.push(originalLine.slice(Math.min(fence.indent, originalLine.match(/^\s*/)?.[0].length ?? 0)).trimEnd());
      continue;
    }

    let line = originalLine.replaceAll("\u00a0", " ").replaceAll("\u3000", " ").trimEnd();
    if (!line.trim()) {
      normalized.push("");
      continue;
    }

    line = line.replace(/<code>([^<>`\n]+)<\/code>/gi, (_, code) => `\`${code.trim()}\``);
    line = line.replace(/\*\*([^*\n]+?)([，。；：！？]+)\*\*/g, "**$1**$2");
    line = line.replace(/\*\*([^*\n]+?)\*\*/g, (_, emphasis) => `**${emphasis.trim()}**`);
    line = line.replace(/\*\*([^*\n]+)\*\*(?=[^\s，。；：！？、）】])/g, "**$1** ");
    line = line.replace(/([\p{L}\p{N}])\*\*([^*\n]+)\*\*/gu, "$1 **$2**");
    line = line.replace(/^(\s*[-+*])\s{2,}(?=\S)/, "$1 ");
    line = line.replace(/^(\s*\d+\.)\s{2,}(?=\S)/, "$1 ");
    line = collapseProseSpaces(line);
    normalized.push(line);
  }

  return normalized;
}

function normalizeSemanticBlocks(lines, title) {
  const normalized = [];
  let fence = null;
  const linkHeadingCount = lines.filter(line => /^#{3,6}\s+.*\[[^\]]+\]\([^)]+\)/.test(line)).length;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^ {0,3}(`{3,})(.*)$/);
    if (fenceMatch) {
      fence = fence ? null : { char: "`", length: fenceMatch[1].length };
      normalized.push(line);
      continue;
    }
    if (fence) {
      normalized.push(line);
      continue;
    }

    if (isLegacyLanguageLabel(line) && nextNonBlankLine(lines, index)?.startsWith("```")) continue;

    const images = splitStandaloneImages(line);
    if (images) {
      normalized.push(...images);
      continue;
    }

    const heading = parseHeading(line);
    if (heading) {
      const headingText = normalizeHeadingText(heading.text);
      if (linkHeadingCount >= 5 && heading.level >= 3 && /\[[^\]]+\]\([^)]+\)/.test(headingText)) {
        normalized.push(`- ${headingText}`);
        continue;
      }
      const headingImages = splitHeadingImages(headingText);
      if (headingImages) {
        if (headingImages.text) normalized.push(`${"#".repeat(heading.level === 1 ? 2 : heading.level)} ${headingImages.text}`);
        normalized.push(...headingImages.images);
        continue;
      }
      if (heading.level === 1 && equivalentText(headingText, title)) continue;
      normalized.push(`${"#".repeat(heading.level === 1 ? 2 : heading.level)} ${headingText}`);
      continue;
    }

    const boldHeading = parseNumberedBoldHeading(line);
    if (boldHeading) {
      normalized.push(`${"#".repeat(boldHeading.level)} ${normalizeHeadingText(boldHeading.text)}`);
      continue;
    }

    const numberedBlock = parsePlainNumberedBlock(lines, index);
    if (numberedBlock) {
      normalized.push(`${"#".repeat(numberedBlock.level)} ${normalizeHeadingText(numberedBlock.text)}`);
      continue;
    }

    if (isConsecutiveNumberedItem(lines, index)) {
      normalized.push(line.replace(/^(\s*)\d+、\s*/, "$11. "));
      continue;
    }

    normalized.push(line);
  }

  return normalized;
}

function normalizeHeadingLevels(lines, title) {
  const normalized = [];
  let fence = null;
  let previousLevel = 1;
  let activeSecondLevelNumber = null;
  let activeSecondLevelIsChinese = false;
  let hasThirdLevel = false;

  for (const line of lines) {
    const fenceMatch = line.match(/^ {0,3}(`{3,})/);
    if (fenceMatch) {
      fence = fence ? null : { length: fenceMatch[1].length };
      normalized.push(line);
      continue;
    }
    if (fence) {
      normalized.push(line);
      continue;
    }

    const heading = parseHeading(line);
    if (!heading) {
      normalized.push(line);
      continue;
    }

    const headingText = normalizeHeadingText(heading.text);
    let level = inferHeadingLevel(headingText, heading.level);
    const singleNumber = headingText.match(/^(\d+)\.\s/);
    if (
      singleNumber &&
      hasThirdLevel &&
      previousLevel >= 3 &&
      (previousLevel === 4 || Number(singleNumber[1]) <= activeSecondLevelNumber)
    ) {
      level = 4;
    } else if (singleNumber && activeSecondLevelIsChinese) {
      level = 3;
    }
    if (level > previousLevel + 1) level = previousLevel + 1;
    if (level < 2) level = 2;
    previousLevel = level;

    if (equivalentText(headingText, title)) continue;
    normalized.push(`${"#".repeat(level)} ${headingText}`);
    if (level === 2) {
      activeSecondLevelNumber = Number(headingText.match(/^(\d+)\./)?.[1] ?? NaN);
      activeSecondLevelIsChinese = /^[一二三四五六七八九十百]+、/.test(headingText);
      hasThirdLevel = false;
    } else if (level === 3) {
      hasThirdLevel = true;
    }
  }

  return normalized;
}

function addImageDescriptions(lines, title) {
  let currentSection = cleanLabel(title) || "文章配图";
  let sectionImageIndex = 0;
  let fence = null;

  return lines.map(line => {
    const fenceMatch = line.match(/^ {0,3}(`{3,})/);
    if (fenceMatch) {
      fence = fence ? null : { length: fenceMatch[1].length };
      return line;
    }
    if (fence) return line;

    const heading = parseHeading(line);
    if (heading) {
      currentSection = cleanLabel(heading.text) || cleanLabel(title) || "文章配图";
      sectionImageIndex = 0;
      return line;
    }

    return line.replace(/!\[([^\]]*)\](\([^\n)]+(?:\s+["'][^"']*["'])?\))/g, (match, alt, destination) => {
      if (!needsImageDescription(alt)) return match;
      sectionImageIndex += 1;
      const suffix = sectionImageIndex > 1 ? ` ${sectionImageIndex}` : "";
      return `![${currentSection}示意图${suffix}]${destination}`;
    });
  });
}

function removeAdjacentDuplicateParagraphs(lines) {
  const result = [];
  let fence = null;
  let lastParagraph = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^ {0,3}(`{3,})/);
    if (fenceMatch) {
      fence = fence ? null : { length: fenceMatch[1].length };
      result.push(line);
      lastParagraph = null;
      continue;
    }
    if (fence) {
      result.push(line);
      continue;
    }

    if (!line) {
      result.push(line);
      continue;
    }

    const isParagraph = !/^(?:#{1,6}\s|>|[-+*]\s|\d+\.\s|!\[|<!--|\{|<)/.test(line);
    const comparable = line.replace(/\s+/g, " ").trim();
    if (isParagraph && comparable === lastParagraph) continue;
    result.push(line);
    lastParagraph = isParagraph ? comparable : null;
  }

  return result;
}

function normalizeBlockSpacing(lines) {
  const result = [];
  let fence = null;

  const pushBlank = () => {
    if (result.length && result.at(-1) !== "") result.push("");
  };

  for (const line of lines) {
    const fenceMatch = line.match(/^ {0,3}(`{3,})/);
    if (fenceMatch) {
      if (!fence) {
        pushBlank();
        result.push(line);
        fence = { length: fenceMatch[1].length };
      } else {
        result.push(line);
        fence = null;
        result.push("");
      }
      continue;
    }

    if (fence) {
      result.push(line);
      continue;
    }

    const isSpacedBlock = /^(?:#{1,6}\s|!\[[^\]]*\]\(|<!-- more -->$)/.test(line);
    if (isSpacedBlock) {
      pushBlank();
      result.push(line);
      result.push("");
      continue;
    }

    if (line === "") {
      pushBlank();
      continue;
    }

    result.push(line);
  }

  while (result.at(-1) === "") result.pop();
  return result;
}

function parseHeading(line) {
  const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
  return match ? { level: match[1].length, text: match[2] } : null;
}

function parseNumberedBoldHeading(line) {
  const match = line.match(/^\*\*(.+?)\*\*[：:]?$/);
  if (!match) return null;
  const escapedOrdinal = /^\d+\\\.\s*/.test(match[1]);
  const text = match[1].replaceAll("\\.", ".").trim();
  if (/^\d+\.\d+/.test(text)) return { level: 3, text };
  if (/^(?:\d+|[一二三四五六七八九十百]+)、/.test(text) || escapedOrdinal) return { level: 2, text };
  if (/^\d+[.)）]/.test(text)) return { level: 3, text };
  return null;
}

function parsePlainNumberedBlock(lines, index) {
  const line = lines[index];
  if (line.length > 90 || !isBlankBoundary(lines, index)) return null;
  const decimalMatch = line.match(/^(\d+(?:\.\d+)+)[、.．]?\s+(.+)$/);
  if (decimalMatch) return { level: 3, text: `${decimalMatch[1]} ${decimalMatch[2]}` };
  const sectionMatch = line.match(/^(\d+)、\s*(.+)$/);
  if (sectionMatch) return { level: 2, text: `${sectionMatch[1]}. ${sectionMatch[2]}` };
  const chineseSectionMatch = line.match(/^([一二三四五六七八九十百]+)、\s*(.+)$/);
  if (chineseSectionMatch) return { level: 2, text: `${chineseSectionMatch[1]}、${chineseSectionMatch[2]}` };
  return null;
}

function isConsecutiveNumberedItem(lines, index) {
  if (!/^\s*\d+、\s*\S/.test(lines[index])) return false;
  const previous = previousNonBlankLine(lines, index);
  const next = nextNonBlankLine(lines, index);
  return /^\s*\d+、\s*\S/.test(previous ?? "") || /^\s*\d+、\s*\S/.test(next ?? "");
}

function inferHeadingLevel(text, currentLevel) {
  const plainText = normalizeHeadingText(text);
  if (/^\d+\.\d+(?:\.\d+)?\s/.test(plainText)) return 3;
  if (/^\d+[、.)）]\s*/.test(plainText)) return 2;
  return Math.min(currentLevel, 3);
}

function normalizeHeadingText(text) {
  let value = text.trim();
  const boldMatch = value.match(/^\*\*(.+?)\*\*$/);
  if (boldMatch) value = boldMatch[1].trim();
  value = value.replace(/^(\d+)\.\s+(\d+(?:\.\d+)*)\s+/, "$1.$2 ");
  const decimalMatch = value.match(/^(\d+(?:\.\d+)+)[、.．]?\s*(.+)$/);
  if (decimalMatch) value = `${decimalMatch[1]} ${decimalMatch[2]}`;
  else value = value.replace(/^(\d+)[、.．]\s*/, "$1. ");
  value = value.replace(/^([一二三四五六七八九十百]+)、\s*/, "$1、");
  value = value.replace(/\*\*([^*]+)\*\*/g, "$1");
  value = value.replace(/[：:；;。]$/, "").trim();
  return value;
}

function normalizeFenceLanguage(value) {
  const language = value.trim().toLowerCase();
  const aliases = new Map([
    ["js", "javascript"],
    ["shell", "bash"],
    ["sh", "bash"],
    ["html5", "html"],
  ]);
  return aliases.get(language) ?? language;
}

function collapseProseSpaces(line) {
  const leading = line.match(/^\s*/)?.[0] ?? "";
  const content = line.slice(leading.length);
  if (leading.length >= 4 && /^(?:\*\*|`|[\u3400-\u9fff])/.test(content)) {
    return content.replace(/ {2,}/g, " ").replace(/ +([，。；：！？、）】])/g, "$1");
  }
  if (leading.length >= 4 || /^<[^>]+>/.test(content) || /^\|/.test(content)) return line;
  const normalizedLeading = /^(?:[-+*]\s|\d+\.\s|>)/.test(content) ? leading : "";
  return `${normalizedLeading}${content.replace(/ {2,}/g, " ").replace(/ +([，。；：！？、）】])/g, "$1")}`;
}

function splitStandaloneImages(line) {
  const images = line.match(/!\[[^\]]*\]\([^\n)]+(?:\s+["'][^"']*["'])?\)/g);
  if (!images || images.length < 2) return null;
  return line.replace(/!\[[^\]]*\]\([^\n)]+(?:\s+["'][^"']*["'])?\)/g, "").trim() ? null : images;
}

function splitHeadingImages(text) {
  const images = text.match(/!\[[^\]]*\]\([^\n)]+(?:\s+["'][^"']*["'])?\)/g);
  if (!images) return null;
  return {
    images,
    text: text.replace(/!\[[^\]]*\]\([^\n)]+(?:\s+["'][^"']*["'])?\)/g, "").replace(/\s{2,}/g, " ").trim(),
  };
}

function unwrapOverquotedContent(lines) {
  const markerIndex = lines.findIndex(line => line.trim() === "<!-- more -->");
  if (markerIndex < 0) return lines;
  const articleLines = lines.slice(markerIndex + 1);
  const nonBlankLines = articleLines.filter(line => line.trim());
  const quotedLines = nonBlankLines.filter(line => /^\s*>/.test(line));
  if (!nonBlankLines.length || quotedLines.length / nonBlankLines.length < 0.8) return lines;

  return lines.map((line, index) => (index > markerIndex ? line.replace(/^(\s*)> ?/, "$1") : line));
}

function isLegacyLanguageLabel(line) {
  return /^\*\*\\\[(?:php|html|javascript|js|css|sql|json)\\\]\*\*$/i.test(line.trim());
}

function needsImageDescription(alt) {
  return (
    !alt.trim() ||
    /(?:Ã|Â|æ|ç|è|é|å|ï¿½|�)/.test(alt) ||
    /(?:在这里插入)?图片描述/.test(alt) ||
    /示意图(?: \d+)?$/.test(alt)
  );
}

function cleanLabel(value) {
  const label = value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/^\d+(?:\.\d+)+\s+/, "")
    .replace(/^\d+[、.)）]\s*/, "")
    .replace(/^[一二三四五六七八九十百]+、\s*/, "")
    .replace(/[：:]$/, "")
    .trim();
  const conciseLabel = label.split(/\s+##\s+|[：，；。]|\s+->\s+/)[0].trim();
  return (conciseLabel.length >= 4 ? conciseLabel : label).slice(0, 28);
}

function equivalentText(left, right) {
  const normalize = value => cleanLabel(value).toLowerCase().replace(/[\s—–_()（）:：]/g, "");
  return normalize(left) === normalize(right);
}

function isBlankBoundary(lines, index) {
  return (index === 0 || lines[index - 1] === "") && (index === lines.length - 1 || lines[index + 1] === "");
}

function previousNonBlankLine(lines, index) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (lines[cursor]) return lines[cursor];
  }
  return null;
}

function nextNonBlankLine(lines, index) {
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    if (lines[cursor]) return lines[cursor];
  }
  return null;
}

async function listMarkdownFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".md"))
    .map(entry => path.join(directory, entry.name))
    .sort();
}
