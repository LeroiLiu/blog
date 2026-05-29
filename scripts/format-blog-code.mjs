import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const root = process.argv[2] || 'docs/blog'
const tab = '  '
const require = createRequire(import.meta.url)
const esbuild = loadEsbuild()

const blockRe =
  /<div class="language-([^"\s]+) vp-adaptive-theme"><button title="Copy Code" class="copy"><\/button><span class="lang">([^<]+)<\/span><pre class="vp-code" tabindex="0" v-pre><code>([\s\S]*?)<\/code><\/pre><\/div>/g

const files = []
walk(root)

let blockCount = 0
let formattedCount = 0
let changedFiles = 0
let csdnCount = 0
const langCount = new Map()

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8')
  let changed = false
  const next = original.replace(blockRe, (full, oldLang, label, rawCode) => {
    blockCount += 1
    const result = formatBlock(oldLang, decode(rawCode), file)
    langCount.set(result.lang, (langCount.get(result.lang) || 0) + 1)

    if (result.fromCsdn) csdnCount += 1

    const encoded = encode(result.code)
    const updated = renderBlock(result.lang, encoded)

    if (updated !== full) {
      changed = true
      formattedCount += 1
    }

    return updated
  })

  if (changed) {
    fs.writeFileSync(file, next)
    changedFiles += 1
  }
}

console.log(
  JSON.stringify(
    {
      files: files.length,
      codeBlocks: blockCount,
      formattedBlocks: formattedCount,
      changedFiles,
      csdnWrapperFixed: csdnCount,
      languages: [...langCount.entries()].sort((a, b) => b[1] - a[1])
    },
    null,
    2
  )
)

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name)
    const stat = fs.statSync(file)
    if (stat.isDirectory()) {
      walk(file)
    } else if (file.endsWith('.md')) {
      files.push(file)
    }
  }
}

function renderBlock(lang, code) {
  return `<div class="language-${lang} vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">${lang}</span><pre class="vp-code" tabindex="0" v-pre><code>${code}</code></pre></div>`
}

function formatBlock(lang, source, file) {
  let code = clean(source)
  let nextLang = normalizeLang(lang)
  let fromCsdn = false

  const csdn = extractCsdnCode(code)
  if (csdn) {
    code = csdn.code
    nextLang = normalizeLang(csdn.lang)
    fromCsdn = true
  }

  code = restoreSplitTemplateBraces(code)
  nextLang = inferLang(nextLang, code, file)

  if (nextLang === 'html' || nextLang === 'xml') {
    code = formatMarkup(code, nextLang)
  } else if (nextLang === 'php' || nextLang === 'javascript') {
    code = formatBraceCode(code, nextLang)
  } else if (nextLang === 'shell') {
    code = formatShell(code)
  } else if (nextLang === 'sql') {
    code = formatSql(code)
  } else if (nextLang === 'json') {
    code = formatJson(code)
  } else if (nextLang === 'nginx') {
    code = formatNginx(code)
  } else if (nextLang === 'ini') {
    code = formatIni(code)
  } else {
    code = formatPlain(code)
  }

  return {
    lang: nextLang,
    code: clean(code),
    fromCsdn
  }
}

function normalizeLang(lang) {
  const value = String(lang || 'text').trim().toLowerCase()
  const map = {
    bash: 'shell',
    sh: 'shell',
    js: 'javascript',
    ts: 'typescript',
    vue: 'html',
    blade: 'php',
    plain: 'text'
  }

  return map[value] || value
}

function inferLang(lang, code, file) {
  const trimmed = code.trim()

  if (lang === 'html' && looksLikePhp(trimmed) && !looksLikeMarkup(trimmed)) {
    return 'php'
  }

  if (lang === 'php' && looksLikeMarkup(trimmed) && !looksLikePhpClass(trimmed)) {
    return 'html'
  }

  if ((lang === 'text' || lang === 'javascript') && looksLikeJsonFragment(trimmed)) {
    return 'json'
  }

  if (lang === 'text') {
    if (looksLikeJson(trimmed)) return 'json'
    if (looksLikeSql(trimmed)) return 'sql'
    if (looksLikeShell(trimmed)) return 'shell'
    if (looksLikeNginx(trimmed)) return 'nginx'
    if (looksLikePhp(trimmed)) return 'php'
  }

  if (file.includes('/database/') && looksLikeSql(trimmed)) {
    return 'sql'
  }

  return lang
}

function extractCsdnCode(code) {
  const langMatch = code.match(/<strong>\[([a-z0-9_+-]+)\]<\/strong>/i)
  if (!langMatch) return null

  const pieces = []
  for (const line of code.split('\n')) {
    const match = line.trim().match(/^<span>([\s\S]*?)<\/span>$/)
    if (!match) continue

    const text = stripTags(match[1]).trim()
    if (text) pieces.push(text)
  }

  const joined = pieces.join('')
  if (!joined) return null

  return {
    lang: langMatch[1],
    code: joined
  }
}

function formatMarkup(code, lang) {
  const lines = explodeMarkup(clean(code).split('\n'))
  const out = []
  let indent = 0

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('//') || line.startsWith('#')) {
      out.push(line)
      continue
    }

    if (/^<style\b/i.test(line)) {
      out.push(tab.repeat(indent) + line)
      const css = []
      i += 1
      while (i < lines.length && !/^<\/style>/i.test(lines[i].trim())) {
        css.push(lines[i])
        i += 1
      }
      for (const item of formatCss(css.join('\n')).split('\n')) {
        if (item.trim()) out.push(tab.repeat(indent + 1) + item)
      }
      if (i < lines.length) out.push(tab.repeat(indent) + lines[i].trim())
      continue
    }

    if (/^<script\b/i.test(line)) {
      out.push(tab.repeat(indent) + line)
      const script = []
      i += 1
      while (i < lines.length && !/^<\/script>/i.test(lines[i].trim())) {
        script.push(lines[i])
        i += 1
      }
      for (const item of formatBraceCode(script.join('\n'), 'javascript').split('\n')) {
        if (item.trim()) out.push(tab.repeat(indent + 1) + item)
      }
      if (i < lines.length) out.push(tab.repeat(indent) + lines[i].trim())
      continue
    }

    if (isMarkupClose(line) || isBladeMiddle(line) || isBladeEnd(line)) {
      indent = Math.max(0, indent - 1)
    }

    out.push(tab.repeat(indent) + line)

    if (opensMarkup(line, lang) || isBladeStart(line) || isBladeMiddle(line)) {
      indent += 1
    }
  }

  return out.join('\n')
}

function explodeMarkup(lines) {
  const out = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (shouldKeepInlineMarkup(trimmed)) {
      out.push(trimmed)
      continue
    }

    const expanded = trimmed
      .replace(/>\s*(?=<)/g, '>\n')
      .replace(/(?<=>)\s+(?=<\/[a-zA-Z])/g, '\n')

    for (const item of expanded.split('\n')) {
      if (item.trim()) out.push(item.trim())
    }
  }
  return out
}

function shouldKeepInlineMarkup(line) {
  if (!line.includes('<') || !line.includes('>')) return true
  if (/^<[^/!][^>]*>[^<]+<\/[^>]+>$/.test(line)) return true
  if (/^<a\b[\s\S]*<\/a>$/.test(line)) return true
  if (/^<span\b[\s\S]*<\/span>$/.test(line)) return true
  if (/^<title\b[\s\S]*<\/title>$/.test(line)) return true
  return false
}

function opensMarkup(line, lang) {
  if (!/^<[^/!?][^>]*>$/.test(line)) return false
  if (/\/>$/.test(line)) return false
  if (/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(line)) return false
  const name = line.match(/^<([a-zA-Z0-9:-]+)/)?.[1]
  if (!name) return false
  if (new RegExp(`<\\/${escapeRegExp(name)}>\\s*$`, 'i').test(line)) return false
  return true
}

function isMarkupClose(line) {
  return /^<\/[a-zA-Z0-9:-]+>/.test(line)
}

function formatCss(code) {
  const prepared = clean(code)
    .replace(/\s*{\s*/g, ' {\n')
    .replace(/;\s*/g, ';\n')
    .replace(/\s*}\s*/g, '\n}\n')

  const out = []
  let indent = 0

  for (const raw of prepared.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('}')) indent = Math.max(0, indent - 1)
    out.push(tab.repeat(indent) + line)
    if (line.endsWith('{')) indent += 1
  }

  return out.join('\n')
}

function formatBraceCode(code, lang) {
  if (lang === 'javascript') {
    const formatted = formatJsWithEsbuild(code)
    if (formatted) return formatted
  }

  if (lang === 'php') {
    code = normalizePhp(code)
  }

  const out = []
  let indent = 0

  const prepared = joinSplitClosers(joinFunctionParams(joinSplitIndexes(clean(code))))

  for (const raw of expandStatements(prepared).split('\n')) {
    let line = raw.trim()
    if (!line) continue

    if (/^\*(?!\/)/.test(line)) line = ` ${line}`
    if (line === '*/') line = ' */'
    if (lang === 'php') line = spaceCommas(line).replace(/,\s+\]/g, ']')

    if (isBladeMiddle(line) || isBladeEnd(line) || /^[}\])]/.test(line)) {
      indent = Math.max(0, indent - 1)
    }

    out.push(tab.repeat(indent) + line)

    if (isBladeStart(line) || isBladeMiddle(line)) {
      indent += 1
      continue
    }

    const delta = braceDelta(line)
    if (delta > 0) indent += delta
  }

  return out.join('\n')
}

function expandStatements(code) {
  const lines = []

  for (const raw of code.split('\n')) {
    const line = raw.trim()
    if (!line) {
      lines.push('')
      continue
    }

    if (line.includes(';') || line.includes('{') || line.includes('}')) {
      lines.push(...splitCodeLine(line))
    } else {
      lines.push(line)
    }
  }

  return lines.join('\n')
}

function splitCodeLine(line) {
  const result = []
  let chunk = ''
  let quote = ''
  let paren = 0
  let square = 0
  let escapeNext = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    const next = line[i + 1]
    chunk += ch

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (ch === '\\') {
      escapeNext = true
      continue
    }

    if (quote) {
      if (ch === quote) quote = ''
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }

    if (ch === '(') paren += 1
    if (ch === ')') paren = Math.max(0, paren - 1)
    if (ch === '[') square += 1
    if (ch === ']') square = Math.max(0, square - 1)

    const atTop = paren === 0 && square === 0
    const canBreakSemi = ch === ';' && paren === 0 && !/^\s*for\s*\(/.test(line)

    if (canBreakSemi) {
      pushChunk(result, chunk)
      chunk = ''
      while (next === ' ' && line[i + 1] === ' ') i += 1
    }
  }

  pushChunk(result, chunk)
  return result.length ? result : [line]
}

function pushChunk(result, chunk) {
  const value = chunk.trim()
  if (value) result.push(value)
}

function restoreSplitTemplateBraces(code) {
  const lines = clean(code).split('\n')
  const out = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const current = line.trim()
    const next = lines[i + 1]?.trim()
    const body = lines[i + 2]?.trim()
    const end = lines[i + 3]?.trim()

    if ((current === '{' || current === '@{') && next === '{' && body?.endsWith('}') && end === '}') {
      const indent = line.match(/^\s*/)?.[0] || ''
      const content = body.slice(0, -1).trim()
      const prefix = current === '@{' ? '@' : ''

      if (!prefix && content.startsWith('--') && content.endsWith('--')) {
        out.push(`${indent}{{-- ${content.slice(2, -2).trim()} --}}`)
      } else {
        out.push(`${indent}${prefix}{{ ${content} }}`)
      }

      i += 3
      continue
    }

    out.push(line)
  }

  return out.join('\n')
}

function braceDelta(line) {
  let quote = ''
  let escapeNext = false
  let delta = 0

  for (const ch of line) {
    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (ch === '\\') {
      escapeNext = true
      continue
    }

    if (quote) {
      if (ch === quote) quote = ''
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }

    if (ch === '{' || ch === '[') delta += 1
    if (ch === '}' || ch === ']') delta -= 1
  }

  return Math.max(0, delta)
}

function isBladeStart(line) {
  return /^@(section|if|foreach|forelse|for|while|unless|switch|auth|guest|isset|empty|push|component|slot)\b/.test(line)
}

function isBladeMiddle(line) {
  return /^@(else|elseif|empty|case|default)\b/.test(line)
}

function isBladeEnd(line) {
  return /^@(stop|show|endsection|endif|endforeach|endforelse|endfor|endwhile|endunless|endswitch|endauth|endguest|endisset|endempty|endpush|endcomponent|endslot)\b/.test(line)
}

function formatShell(code) {
  const out = []
  let indent = 0

  for (const raw of clean(code).split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (/^(fi|done|esac|else|elif\b|\})\b/.test(line)) {
      indent = Math.max(0, indent - 1)
    }

    out.push(tab.repeat(indent) + line)

    if (/^(if|for|while|until|case)\b/.test(line) || /(\bthen|\bdo|\{)\s*$/.test(line) || /^(else|elif\b)/.test(line)) {
      indent += 1
    }
  }

  return out.join('\n')
}

function formatSql(code) {
  let text = clean(code)

  if (!text.includes('\n')) {
    text = text
      .replace(/\b(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|VALUES|SET)\b/gi, '\n$1')
      .replace(/\b((?:LEFT|RIGHT|INNER|OUTER|FULL)\s+JOIN|JOIN)\b/gi, '\n$1')
      .replace(/\b(AND|OR)\b/gi, '\n  $1')
  }

  const out = []
  let indent = 0
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (/^\)/.test(line)) indent = Math.max(0, indent - 1)
    out.push(tab.repeat(indent) + line)
    if (/\($/.test(line)) indent += 1
  }

  return out.join('\n')
}

function formatJson(code) {
  const text = clean(code)
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    const fragment = formatJsonFragment(text)
    if (fragment) return fragment
    return formatPlain(text)
  }
}

function formatNginx(code) {
  const out = []
  let indent = 0
  for (const raw of clean(code).split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const isComment = line.startsWith('#')
    if (!isComment && line.startsWith('}')) indent = Math.max(0, indent - 1)
    out.push(tab.repeat(indent) + line)
    if (!isComment && line.endsWith('{')) indent += 1
  }
  return out.join('\n')
}

function formatIni(code) {
  return clean(code)
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
}

function formatPlain(code) {
  if (looksLikeVb(code)) return formatVb(code)

  return clean(code)
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
}

function loadEsbuild() {
  const pnpmDir = path.join(process.cwd(), 'node_modules/.pnpm')
  try {
    const match = fs
      .readdirSync(pnpmDir)
      .find((name) => /^esbuild@/.test(name))

    if (!match) return null

    return require(path.join(pnpmDir, match, 'node_modules/esbuild'))
  } catch {
    return null
  }
}

function formatJsWithEsbuild(code) {
  if (!esbuild) return null

  try {
    const result = esbuild.transformSync(clean(code), {
      loader: 'js',
      format: 'esm',
      minify: false,
      legalComments: 'inline',
      charset: 'utf8'
    })

    return clean(result.code.replace(/^export \{\};\n?$/, ''))
  } catch {
    return null
  }
}

function normalizePhp(code) {
  return clean(code)
    .replace(/\/\*\*\s+\*\s+/g, '/**\n * ')
    .replace(/\s+\*\/$/gm, '\n */')
    .replace(/^(\s*)\*(?!\/)/gm, '$1 *')
    .replace(/^(\s*)\*\/$/gm, '$1 */')
    .replace(/\b(if|foreach|for|while|switch|catch)\(/g, '$1 (')
    .replace(/\s*=>\s*/g, ' => ')
    .replace(/\s*(?<![!<>=])=(?![=>])\s*/g, ' = ')
    .replace(/^(\s*class\s+[^{]+)\s*\{$/gm, '$1\n{')
    .replace(/^(\s*(?:(?:public|private|protected|static)\s+)*function\s+\w+[^{]+)\s*\{$/gm, '$1\n{')
    .replace(/\bfunction\(/g, 'function (')
    .replace(/\[\s*\n\s*\]/g, '[]')
}

function spaceCommas(line) {
  let result = ''
  let quote = ''
  let escapeNext = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    const next = line[i + 1]
    result += ch

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (ch === '\\') {
      escapeNext = true
      continue
    }

    if (quote) {
      if (ch === quote) quote = ''
      continue
    }

    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }

    if (ch === ',' && next && !/\s/.test(next)) {
      result += ' '
    }
  }

  return result
}

function formatJsonFragment(code) {
  if (!looksLikeJsonFragment(code)) return null

  try {
    const value = JSON.parse(`{${code.replace(/,\s*$/, '')}}`)
    const body = JSON.stringify(value, null, 2).split('\n')
    return `${body.slice(1, -1).map((line) => line.slice(2)).join('\n')},`
  } catch {
    return null
  }
}

function joinSplitIndexes(code) {
  const lines = clean(code).split('\n')
  const out = []

  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i].trim()

    while (line.endsWith('[') && lines[i + 1] && lines[i + 2]?.trim().startsWith(']')) {
      line += `${lines[i + 1].trim()}${lines[i + 2].trim()}`
      i += 2
    }

    out.push(line)
  }

  return out.join('\n')
}

function joinSplitClosers(code) {
  const lines = clean(code).split('\n')
  const out = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim()
    const next = lines[i + 1]?.trim()

    if (line === '}' && next === ');') {
      out.push('});')
      i += 1
      continue
    }

    out.push(lines[i])
  }

  return out.join('\n')
}

function joinFunctionParams(code) {
  const lines = clean(code).split('\n')
  const out = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim()

    if (/\bfunction\s*\([^)]*,\s*$/.test(line)) {
      const parts = [line]
      let j = i + 1

      while (j < lines.length) {
        const item = lines[j].trim()
        parts.push(item)
        if (item.includes(')')) break
        j += 1
      }

      if (lines[j + 1]?.trim() === '{') {
        out.push(`${parts.join(' ').replace(/\s+/g, ' ')} {`)
        i = j + 1
        continue
      }
    }

    if (/^function\s*\([^)]*\)$/.test(line) && lines[i + 1]?.trim() === '{') {
      out.push(`${line} {`)
      i += 1
      continue
    }

    out.push(lines[i])
  }

  return out.join('\n')
}

function formatVb(code) {
  const out = []
  let indent = 0

  for (const raw of clean(code).split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (/^(End If|End Sub|End Function|Next|Loop|Wend|Else|ElseIf\b)/i.test(line)) {
      indent = Math.max(0, indent - 1)
    }

    out.push(tab.repeat(indent) + line)

    if (/^(If\b[\s\S]*\bThen|For\b|For Each\b|Do\b|While\b|Sub\b|Function\b|Else|ElseIf\b)/i.test(line) && !/^End\b/i.test(line)) {
      indent += 1
    }
  }

  return out.join('\n')
}

function clean(code) {
  return code
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
}

function decode(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&amp;/g, '&')
}

function encode(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, '')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function looksLikeMarkup(code) {
  return /<\/?(html|head|body|div|span|table|form|input|a|p|style|script|template|meta|title)\b/i.test(code)
}

function looksLikePhp(code) {
  return /<\?php|\$[a-zA-Z_]\w*|->|::|namespace\s+|use\s+[A-Z_a-z\\]|function\s+\w+\s*\(|class\s+\w+|Route::|header\s*\(/.test(code)
}

function looksLikePhpClass(code) {
  return /class\s+\w+|namespace\s+|use\s+[A-Z_a-z\\]/.test(code)
}

function looksLikeJson(code) {
  return /^[[{][\s\S]*[\]}]$/.test(code)
}

function looksLikeJsonFragment(code) {
  return /^"[a-zA-Z0-9_/-]+"\s*:\s*[\[{]/.test(code.trim())
}

function looksLikeSql(code) {
  return /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|EXPLAIN|SHOW)\b/i.test(code)
}

function looksLikeShell(code) {
  return /^(sudo |cd |cp |mv |rm |mkdir |chmod |chown |ln |curl |wget |ssh |scp |tar |yum |apt |brew |composer |php artisan|npm |pnpm |yarn |redis-server|lnmp |docker |kubectl |systemctl |service |GOOS=|export )/m.test(code)
}

function looksLikeNginx(code) {
  return /\b(server|location|upstream)\s*\{/.test(code)
}

function looksLikeVb(code) {
  return /\b(CreateObject|WScript|MsgBox|Dim |Set |For Each|End If|Then)\b/i.test(code)
}
