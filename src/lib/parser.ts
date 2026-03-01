/**
 * [INPUT]: 无外部依赖（避免循环引用 data.ts）
 * [OUTPUT]: 对外提供 parseStoryParagraph 函数（返回 narrative + statHtml + charColor）
 * [POS]: lib 的 AI 回复解析层。charColor 驱动气泡左边框角色色标
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

// ── 角色名 → 主题色（不 import data.ts，手动同步） ──

const CHARACTER_COLORS: Record<string, string> = {
  '刘在石': '#3b82f6',
  '金钟国': '#dc2626',
  'HAHA': '#f59e0b',
  '宋智孝': '#ec4899',
  '李光洙': '#8b5cf6',
  '池石镇': '#6366f1',
  '全昭旻': '#f43f5e',
  '梁世灿': '#14b8a6',
}

// ── 数值标签 → 颜色（从 StatMeta 硬编码） ──

const STAT_COLORS: Record<string, string> = {
  '信任': '#22c55e', '信任度': '#22c55e',
  '体力': '#ef4444', '体力值': '#ef4444',
  '智商': '#3b82f6', '智商值': '#3b82f6',
  '综艺感': '#f59e0b', '综艺': '#f59e0b',
  '积分': '#FFB800', '个人积分': '#FFB800',
}

const DEFAULT_COLOR = '#FFB800'

// ── 工具函数 ──

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseInlineContent(text: string): string {
  let result = escapeHtml(text)
  for (const [name, color] of Object.entries(CHARACTER_COLORS)) {
    result = result.replaceAll(
      name,
      `<span class="char-name" style="color:${color};font-weight:600">${name}</span>`,
    )
  }
  return result
}

function colorizeStats(line: string): string {
  return line.replace(/([^\s【】]+?)([+-]\d+)/g, (_, label: string, delta: string) => {
    const color = STAT_COLORS[label] || DEFAULT_COLOR
    const cls = delta.startsWith('+') ? 'stat-up' : 'stat-down'
    return `<span class="stat-change ${cls}" style="color:${color}">${label}${delta}</span>`
  })
}

// ── 主解析函数 ──

export function parseStoryParagraph(content: string): {
  narrative: string
  statHtml: string
  charColor: string | null
} {
  const lines = content.split('\n').filter(Boolean)
  const narrativeParts: string[] = []
  const statParts: string[] = []
  let charColor: string | null = null

  for (const raw of lines) {
    const line = raw.trim()

    // 纯数值变化行：【信任度+10 体力-5】
    if (/^【[^】]*[+-]\d+[^】]*】$/.test(line)) {
      statParts.push(colorizeStats(line))
      continue
    }

    // 角色对话：【刘在石】你来了
    const charMatch = line.match(/^【([^】]+)】(.*)/)
    if (charMatch) {
      const [, charName, dialogue] = charMatch
      const color = CHARACTER_COLORS[charName] || DEFAULT_COLOR
      if (!charColor) charColor = color
      narrativeParts.push(
        `<p class="dialogue-line"><span class="char-name" style="color:${color}">${charName}</span>${parseInlineContent(dialogue)}</p>`,
      )
      continue
    }

    // PD画外音：「PD：xxx」
    const pdMatch = line.match(/^「PD[：:](.+)」$/)
    if (pdMatch) {
      narrativeParts.push(
        `<p class="pd-voice" style="color:#94a3b8;font-style:italic">PD：${parseInlineContent(pdMatch[1])}</p>`,
      )
      continue
    }

    // 综艺效果音：※轰隆※
    const sfxLine = line.replace(/※([^※]+)※/g,
      '<span class="sfx" style="color:#FFB800;font-weight:700">$1</span>')
    if (sfxLine !== line) {
      narrativeParts.push(`<p class="narration">${parseInlineContent(sfxLine.replace(/<span[^>]*>[^<]*<\/span>/g, (m) => m))}</p>`)
      continue
    }

    // 动作/旁白
    const actionMatch = line.match(/^[（(]([^）)]+)[）)]/) || line.match(/^\*([^*]+)\*/)
    if (actionMatch) {
      narrativeParts.push(`<p class="action">${parseInlineContent(line)}</p>`)
      continue
    }

    // 字幕效果〔xxx〕
    const subtitleLine = line.replace(/〔([^〕]+)〕/g,
      '<span class="subtitle" style="color:#94a3b8;font-size:12px">[$1]</span>')

    // 普通叙述
    narrativeParts.push(`<p class="narration">${parseInlineContent(subtitleLine !== line ? subtitleLine : line)}</p>`)
  }

  return {
    narrative: narrativeParts.join(''),
    statHtml: statParts.length > 0
      ? `<div class="stat-changes">${statParts.join('')}</div>`
      : '',
    charColor,
  }
}
