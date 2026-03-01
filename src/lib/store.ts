/**
 * [INPUT]: script.md(?raw), stream.ts, data.ts
 * [OUTPUT]: useGameStore (Zustand store) + re-exports from data.ts
 * [POS]: 状态中枢，被所有组件消费。剧本直通管道 + 双轨解析 + 富消息 + 链式反应
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import GAME_SCRIPT from './script.md?raw'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { streamChat, chat } from './stream'
import { extractChoices } from './parser'
import {
  type Character, type CharacterStats, type Message, type StatMeta,
  type StoryRecord,
  PERIODS, MAX_EPISODES, MAX_ACTION_POINTS,
  SCENES, ITEMS, STORY_INFO,
  ROLE_TYPES,
  buildCharacters, getCurrentChapter, getDayEvents,
} from './data'

// ── Types ──

interface GlobalStats {
  stamina: number
  iq: number
  variety: number
  score: number
}

interface GameState {
  gameStarted: boolean
  playerName: string
  playerRole: string
  characters: Record<string, Character>

  currentEpisode: number
  currentPeriodIndex: number
  actionPoints: number

  currentScene: string
  currentCharacter: string | null
  characterStats: Record<string, CharacterStats>
  globalStats: GlobalStats
  unlockedScenes: string[]
  betrayalCount: number

  currentChapter: number
  triggeredEvents: string[]
  inventory: Record<string, number>

  messages: Message[]
  historySummary: string
  isTyping: boolean
  streamingContent: string
  choices: string[]

  endingType: string | null

  activeTab: 'dialogue' | 'scene' | 'character'
  showDashboard: boolean
  showRecords: boolean
  storyRecords: StoryRecord[]
}

interface GameActions {
  setPlayerInfo: (name: string, roleId: string) => void
  initGame: () => void
  selectCharacter: (id: string | null) => void
  selectScene: (sceneId: string) => void
  setActiveTab: (tab: 'dialogue' | 'scene' | 'character') => void
  toggleDashboard: () => void
  toggleRecords: () => void
  sendMessage: (text: string) => Promise<void>
  advanceTime: () => void
  useItem: (itemId: string) => void
  checkEnding: () => void
  addSystemMessage: (content: string) => void
  addStoryRecord: (title: string, content: string) => void
  resetGame: () => void
  saveGame: () => void
  loadGame: () => void
  hasSave: () => boolean
  clearSave: () => void
}

type GameStore = GameState & GameActions

let messageCounter = 0
const makeId = () => `msg-${Date.now()}-${++messageCounter}`
const SAVE_KEY = 'runningman-save-v1'

// ── Dual-track stat parser ──

interface StatChangeResult {
  charChanges: Array<{ charId: string; stat: string; delta: number }>
  globalChanges: Array<{ key: string; delta: number }>
}

function parseStatChanges(
  content: string,
  characters: Record<string, Character>
): StatChangeResult {
  const charChanges: StatChangeResult['charChanges'] = []
  const globalChanges: StatChangeResult['globalChanges'] = []

  const nameToId: Record<string, string> = {}
  for (const [id, char] of Object.entries(characters)) {
    nameToId[char.name] = id
  }

  const labelToKey: Record<string, Array<{ charId: string; key: string }>> = {}
  for (const [charId, char] of Object.entries(characters)) {
    for (const meta of char.statMetas) {
      const labels = [meta.label, meta.label + '度', meta.label + '值']
      for (const label of labels) {
        if (!labelToKey[label]) labelToKey[label] = []
        labelToKey[label].push({ charId, key: meta.key })
      }
    }
  }

  const GLOBAL_ALIASES: Record<string, string> = {
    '体力': 'stamina', '体力值': 'stamina',
    '智商': 'iq', '智商值': 'iq',
    '综艺感': 'variety', '综艺': 'variety',
    '积分': 'score', '个人积分': 'score',
  }

  // Track 1: Character stat changes — 【角色名 数值+N】
  const charRegex = /[【\[]([^\]】]+?)\s+(\S+?)([+-])(\d+)[】\]]/g
  let match
  while ((match = charRegex.exec(content))) {
    const [, context, statLabel, sign, numStr] = match
    const delta = parseInt(numStr) * (sign === '+' ? 1 : -1)
    const charId = nameToId[context]
    if (charId) {
      const entries = labelToKey[statLabel]
      const entry = entries?.find((e) => e.charId === charId) || entries?.[0]
      if (entry) {
        charChanges.push({ charId: entry.charId, stat: entry.key, delta })
      }
    }
  }

  // Track 2: Global stat changes — 【体力+5】【积分+20】
  const globalRegex = /[【\[](\S+?)([+-])(\d+)[】\]]/g
  let gMatch
  while ((gMatch = globalRegex.exec(content))) {
    const [, label, sign, numStr] = gMatch
    const delta = parseInt(numStr) * (sign === '+' ? 1 : -1)
    const globalKey = GLOBAL_ALIASES[label]
    if (globalKey) {
      globalChanges.push({ key: globalKey, delta })
    }
  }

  return { charChanges, globalChanges }
}

// ── System prompt builder ──

function buildStatsSnapshot(state: GameState): string {
  const charLines = Object.entries(state.characterStats)
    .map(([charId, stats]) => {
      const char = state.characters[charId]
      if (!char) return ''
      const statStr = char.statMetas
        .map((m: StatMeta) => `  ${m.icon} ${m.label}: ${stats[m.key] ?? 0}`)
        .join('\n')
      return `${char.name}:\n${statStr}`
    })
    .filter(Boolean)
    .join('\n')

  return charLines
}

function buildSystemPrompt(state: GameState): string {
  const char = state.currentCharacter
    ? state.characters[state.currentCharacter]
    : null
  const chapter = getCurrentChapter(state.currentEpisode)
  const scene = SCENES[state.currentScene]
  const role = ROLE_TYPES.find(r => r.id === state.playerRole)

  return `你是《${STORY_INFO.title}：${STORY_INFO.subtitle}》的AI导演兼旁白。

## 游戏剧本
${GAME_SCRIPT}

## 当前状态
玩家「${state.playerName}」（${role?.name ?? '新人'}）
第${state.currentEpisode}期 · ${PERIODS[state.currentPeriodIndex].name}
第${chapter.id}章「${chapter.name}」
当前场景：${scene.name}
${char ? `当前交互角色：${char.name}` : ''}
背叛次数：${state.betrayalCount}

## 玩家全局属性
💪 体力: ${state.globalStats.stamina}/100
🧠 智商: ${state.globalStats.iq}/100
🎭 综艺感: ${state.globalStats.variety}/100
⭐ 积分: ${state.globalStats.score}

## 成员信任度
${buildStatsSnapshot(state)}

## 背包
${Object.entries(state.inventory).filter(([, v]) => v > 0).map(([k, v]) => `${ITEMS[k]?.name} x${v}`).join('、') || '空'}

## 已触发事件
${state.triggeredEvents.join('、') || '无'}

## 输出格式
- 每段回复 200-400 字（关键对决 500-800 字）
- 角色对话：【角色名】"对话内容"
- 数值变化：【角色名 信任度+N】或【体力+N】【积分+N】
- 综艺效果音：※轰隆※※啪嗒※
- PD画外音：「PD：xxx」
- 严格遵循剧本叙事风格`
}

// ── Store ──

export const useGameStore = create<GameStore>()(immer((set, get) => ({
  // ── Initial state ──
  gameStarted: false,
  playerName: '',
  playerRole: '',
  characters: buildCharacters(),

  currentEpisode: 1,
  currentPeriodIndex: 0,
  actionPoints: MAX_ACTION_POINTS,

  currentScene: 'studio',
  currentCharacter: null,
  characterStats: {},
  globalStats: { stamina: 50, iq: 50, variety: 50, score: 0 },
  unlockedScenes: ['studio', 'hanriver', 'amusement', 'market', 'gymnasium'],
  betrayalCount: 0,

  currentChapter: 1,
  triggeredEvents: [],
  inventory: {},

  messages: [],
  historySummary: '',
  isTyping: false,
  streamingContent: '',
  choices: [],

  endingType: null,

  activeTab: 'dialogue',
  showDashboard: false,
  showRecords: false,
  storyRecords: [],

  // ── Actions ──

  setPlayerInfo: (name: string, roleId: string) => {
    set((s) => {
      s.playerName = name
      s.playerRole = roleId
    })
  },

  initGame: () => {
    const state = get()
    const role = ROLE_TYPES.find(r => r.id === state.playerRole) ?? ROLE_TYPES[0]
    const chars = buildCharacters()
    const charStats: Record<string, CharacterStats> = {}
    for (const [id, char] of Object.entries(chars)) {
      charStats[id] = { ...char.initialStats }
      // Social role gets +10 initial trust
      if (state.playerRole === 'social') {
        charStats[id].trust = (charStats[id].trust ?? 0) + 10
      }
    }

    set((s) => {
      s.gameStarted = true
      s.characters = chars
      s.characterStats = charStats
      s.globalStats = { ...role.initialStats }
      s.messages = []
      s.storyRecords = []
      s.triggeredEvents = []
      s.inventory = {}
      s.currentEpisode = 1
      s.currentPeriodIndex = 0
      s.actionPoints = MAX_ACTION_POINTS
      s.currentScene = 'studio'
      s.currentCharacter = null
      s.currentChapter = 1
      s.endingType = null
      s.betrayalCount = 0
      s.choices = ['挑战对决', '结盟合作', '搞笑整活', '暗中观察']
    })
  },

  selectCharacter: (id: string | null) => {
    set((s) => {
      s.currentCharacter = id
      if (id) s.activeTab = 'dialogue'
    })
  },

  selectScene: (sceneId: string) => {
    const state = get()
    if (!state.unlockedScenes.includes(sceneId)) return
    if (state.currentScene === sceneId) return

    set((s) => {
      s.currentScene = sceneId
      s.activeTab = 'dialogue'
      s.messages.push({
        id: makeId(),
        role: 'system',
        content: `你来到了${SCENES[sceneId].name}。`,
        timestamp: Date.now(),
        type: 'scene-transition',
        sceneId,
      })
    })
  },

  setActiveTab: (tab) => {
    set((s) => { s.activeTab = tab })
  },

  toggleDashboard: () => {
    set((s) => {
      s.showDashboard = !s.showDashboard
      if (s.showDashboard) s.showRecords = false
    })
  },

  toggleRecords: () => {
    set((s) => {
      s.showRecords = !s.showRecords
      if (s.showRecords) s.showDashboard = false
    })
  },

  sendMessage: async (text: string) => {
    set((s) => {
      s.messages.push({
        id: makeId(), role: 'user', content: text, timestamp: Date.now(),
      })
      s.isTyping = true
      s.streamingContent = ''
    })

    try {
      const state = get()

      // History compression
      if (state.messages.length > 15 && !state.historySummary) {
        const summary = await chat([
          { role: 'system', content: '将以下对话压缩为200字以内的摘要，保留关键剧情、数值变化和成员关系变动：' },
          ...state.messages.slice(0, -5).map((m) => ({
            role: m.role, content: m.content,
          })),
        ])
        set((s) => { s.historySummary = summary })
      }

      const systemPrompt = buildSystemPrompt(get())
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...(get().historySummary
          ? [{ role: 'system' as const, content: `历史摘要: ${get().historySummary}` }]
          : []),
        ...get().messages.slice(-10).map((m) => ({
          role: m.role, content: m.content,
        })),
      ]

      let fullContent = ''
      await streamChat(
        apiMessages,
        (chunk) => {
          fullContent += chunk
          set((s) => { s.streamingContent = fullContent })
        },
        () => {},
      )

      // Parse stat changes
      const { charChanges, globalChanges } = parseStatChanges(fullContent, get().characters)

      set((s) => {
        // Apply character stat changes
        for (const change of charChanges) {
          const stats = s.characterStats[change.charId]
          if (stats) {
            stats[change.stat] = Math.max(-100, Math.min(100, (stats[change.stat] ?? 0) + change.delta))
          }
        }
        // Apply global stat changes
        for (const change of globalChanges) {
          const key = change.key as keyof GlobalStats
          if (key === 'score') {
            s.globalStats[key] = Math.max(0, s.globalStats[key] + change.delta)
          } else if (key in s.globalStats) {
            s.globalStats[key] = Math.max(0, Math.min(100, s.globalStats[key] + change.delta))
          }
        }
      })

      // Chain reactions
      set((s) => {
        // Kim Jongkook high trust → stamina bonus in next physical task
        const jkTrust = s.characterStats.jongkook?.trust ?? 0
        if (jkTrust >= 60 && !s.triggeredEvents.includes('chain_jk_ally')) {
          s.triggeredEvents.push('chain_jk_ally')
        }

        // Yoo Jaesuk high trust → variety boost
        const yjsTrust = s.characterStats.jaesuk?.trust ?? 0
        if (yjsTrust >= 70 && !s.triggeredEvents.includes('chain_yjs_boost')) {
          s.globalStats.variety = Math.min(100, s.globalStats.variety + 5)
          s.triggeredEvents.push('chain_yjs_boost')
        }

        // Song Jihyo trust → luck bonus
        const sjhTrust = s.characterStats.jihyo?.trust ?? 0
        if (sjhTrust >= 60 && !s.triggeredEvents.includes('chain_sjh_luck')) {
          s.triggeredEvents.push('chain_sjh_luck')
        }

        // Any member trust ≤ -50 → potential enemy action
        for (const [charId, stats] of Object.entries(s.characterStats)) {
          if ((stats.trust ?? 0) <= -50 && !s.triggeredEvents.includes(`chain_enemy_${charId}`)) {
            s.triggeredEvents.push(`chain_enemy_${charId}`)
          }
        }

        // Check betrayal patterns in content
        if (fullContent.includes('背叛') && fullContent.includes('成功')) {
          s.betrayalCount += 1
        }
      })

      // Check immediate BE conditions
      const postState = get()
      if (postState.globalStats.stamina < 20 && postState.globalStats.score <= 0) {
        set((s) => { s.endingType = 'be-eliminated' })
      }

      // Check all-enemy condition
      const allEnemy = Object.values(postState.characterStats).every(
        (stats) => (stats.trust ?? 0) <= -50
      )
      if (allEnemy) {
        set((s) => { s.endingType = 'be-enemy' })
      }

      // Extract choices from AI response
      const { cleanContent, choices } = extractChoices(fullContent)

      // Fallback: if AI didn't return choices, generate context-aware ones
      const finalChoices = choices.length >= 2 ? choices : (() => {
        const char = get().currentCharacter
          ? get().characters[get().currentCharacter!]
          : null
        if (char) {
          return [`继续和${char.name}互动`, '挑战对决', '结盟合作', '暗中观察']
        }
        return ['挑战对决', '结盟合作', '搞笑整活', '暗中观察']
      })()

      // Push AI message (with clean content, choices stored separately)
      set((s) => {
        s.messages.push({
          id: makeId(), role: 'assistant', content: cleanContent || fullContent,
          character: s.currentCharacter ?? undefined,
          timestamp: Date.now(),
        })
        s.choices = finalChoices.slice(0, 4)
        s.isTyping = false
        s.streamingContent = ''
      })

      // Advance time + save
      get().advanceTime()
      get().saveGame()

      // Story record
      const charName = get().currentCharacter
        ? get().characters[get().currentCharacter!]?.name
        : null
      get().addStoryRecord(charName ?? '旁白', fullContent.slice(0, 40))

    } catch (err) {
      set((s) => { s.isTyping = false; s.streamingContent = '' })
      const msg = err instanceof Error ? err.message : String(err)
      get().addSystemMessage(`网络异常: ${msg.slice(0, 80)}`)
    }
  },

  advanceTime: () => {
    const prevEpisode = get().currentEpisode
    let episodeChanged = false

    set((s) => {
      s.actionPoints -= 1
      s.currentPeriodIndex += 1

      if (s.currentPeriodIndex >= PERIODS.length) {
        s.currentPeriodIndex = 0
        s.currentEpisode += 1
        s.actionPoints = MAX_ACTION_POINTS
        episodeChanged = true

        // Per-episode auto-recovery
        s.globalStats.stamina = Math.min(100, s.globalStats.stamina + 3)

        // Chapter progression
        const newChapter = getCurrentChapter(s.currentEpisode)
        if (newChapter.id !== s.currentChapter) {
          s.currentChapter = newChapter.id
          s.storyRecords.push({
            id: `rec-ch-${newChapter.id}`,
            day: s.currentEpisode,
            period: PERIODS[0].name,
            title: `进入${newChapter.name}`,
            content: newChapter.description,
          })
        }
      }
    })

    const state = get()

    // Episode change rich message
    if (episodeChanged) {
      const chapter = getCurrentChapter(state.currentEpisode)
      set((s) => {
        s.messages.push({
          id: makeId(),
          role: 'system',
          content: '',
          timestamp: Date.now(),
          type: 'episode-change',
          episodeInfo: {
            episode: state.currentEpisode,
            title: `第${state.currentEpisode}期`,
            chapter: chapter.name,
          },
        })
      })
      get().addStoryRecord('期变', `进入第${state.currentEpisode}期`)
    } else {
      get().addSystemMessage(
        `${PERIODS[state.currentPeriodIndex].icon} 第${state.currentEpisode}期 · ${PERIODS[state.currentPeriodIndex].name}`
      )
    }

    // Forced events
    const events = getDayEvents(state.currentEpisode, state.triggeredEvents)
    for (const event of events) {
      if (event.triggerPeriod === undefined || event.triggerPeriod === state.currentPeriodIndex) {
        set((s) => {
          s.triggeredEvents.push(event.id)
          s.storyRecords.push({
            id: `rec-evt-${event.id}`,
            day: state.currentEpisode,
            period: PERIODS[state.currentPeriodIndex].name,
            title: event.name,
            content: event.description,
          })
          // Unlock factory on spy episode
          if (event.id === 'ep5_spy' && !s.unlockedScenes.includes('factory')) {
            s.unlockedScenes.push('factory')
          }
        })
        get().addSystemMessage(`【${event.name}】${event.description}`)
      }
    }

    // Time ending check
    if (state.currentEpisode >= MAX_EPISODES && state.currentPeriodIndex === PERIODS.length - 1) {
      get().checkEnding()
    }

    // Mid-season elimination check
    if (prevEpisode === 9 && episodeChanged) {
      const gs = get().globalStats
      if (gs.stamina < 20 && gs.score <= 30) {
        set((s) => { s.endingType = 'be-eliminated' })
      }
    }
  },

  useItem: (itemId: string) => {
    const state = get()
    if (!state.inventory[itemId] || state.inventory[itemId] <= 0) return

    set((s) => {
      s.inventory[itemId] -= 1
      if (s.inventory[itemId] <= 0) delete s.inventory[itemId]

      switch (itemId) {
        case 'stamina_pack':
          s.globalStats.stamina = Math.min(100, s.globalStats.stamina + 15)
          break
        case 'wisdom_scroll':
          s.globalStats.iq = Math.min(100, s.globalStats.iq + 10)
          break
      }
    })

    const item = ITEMS[itemId]
    if (item) {
      get().addSystemMessage(`使用了 ${item.icon} ${item.name}：${item.description}`)
    }
  },

  checkEnding: () => {
    const state = get()
    const setEnding = (id: string) => { set((s) => { s.endingType = id }) }

    // BE — checked first
    if (state.globalStats.stamina < 20 && state.globalStats.score <= 30) {
      setEnding('be-eliminated'); return
    }
    const allEnemy = Object.values(state.characterStats).every(
      (stats) => (stats.trust ?? 0) <= -50
    )
    if (allEnemy) { setEnding('be-enemy'); return }

    // TE
    if (state.betrayalCount >= 3 && state.globalStats.score >= 100) {
      const hasIronAlly = Object.values(state.characterStats).some(
        (stats) => (stats.trust ?? 0) >= 80
      )
      if (!hasIronAlly) { setEnding('te-betrayer'); return }
    }
    if (state.globalStats.iq >= 85) {
      setEnding('te-brain'); return
    }

    // HE
    const hasIronAlly = Object.values(state.characterStats).some(
      (stats) => (stats.trust ?? 0) >= 80
    )
    if (state.globalStats.score >= 150 && (state.globalStats.stamina >= 75 || state.globalStats.iq >= 75) && hasIronAlly) {
      setEnding('he-strongest'); return
    }
    const avgTrust = Object.values(state.characterStats).reduce(
      (sum, stats) => sum + (stats.trust ?? 0), 0
    ) / Object.keys(state.characterStats).length
    if (state.globalStats.variety >= 80 && avgTrust >= 60) {
      setEnding('he-ace'); return
    }

    // SE
    const role = ROLE_TYPES.find(r => r.id === state.playerRole)
    if (role) {
      const totalInitial = role.initialStats.stamina + role.initialStats.iq + role.initialStats.variety
      if (totalInitial <= 135 && state.globalStats.score >= 100) {
        setEnding('se-underdog'); return
      }
    }

    // NE — fallback
    setEnding('ne-comedian')
  },

  addSystemMessage: (content: string) => {
    set((s) => {
      s.messages.push({
        id: makeId(), role: 'system', content, timestamp: Date.now(),
      })
    })
  },

  addStoryRecord: (title: string, content: string) => {
    const state = get()
    set((s) => {
      s.storyRecords.push({
        id: makeId(),
        day: state.currentEpisode,
        period: PERIODS[state.currentPeriodIndex]?.name ?? '',
        title,
        content,
      })
    })
  },

  resetGame: () => {
    set((s) => {
      s.gameStarted = false
      s.playerName = ''
      s.playerRole = ''
      s.characters = buildCharacters()
      s.currentEpisode = 1
      s.currentPeriodIndex = 0
      s.actionPoints = MAX_ACTION_POINTS
      s.currentScene = 'studio'
      s.currentCharacter = null
      s.characterStats = {}
      s.globalStats = { stamina: 50, iq: 50, variety: 50, score: 0 }
      s.unlockedScenes = ['studio', 'hanriver', 'amusement', 'market', 'gymnasium']
      s.betrayalCount = 0
      s.currentChapter = 1
      s.triggeredEvents = []
      s.inventory = {}
      s.messages = []
      s.historySummary = ''
      s.isTyping = false
      s.streamingContent = ''
      s.choices = []
      s.endingType = null
      s.activeTab = 'dialogue'
      s.showDashboard = false
      s.showRecords = false
      s.storyRecords = []
    })
  },

  saveGame: () => {
    const s = get()
    const data = {
      version: 1,
      playerName: s.playerName,
      playerRole: s.playerRole,
      characters: s.characters,
      currentEpisode: s.currentEpisode,
      currentPeriodIndex: s.currentPeriodIndex,
      actionPoints: s.actionPoints,
      currentScene: s.currentScene,
      currentCharacter: s.currentCharacter,
      characterStats: s.characterStats,
      globalStats: s.globalStats,
      currentChapter: s.currentChapter,
      triggeredEvents: s.triggeredEvents,
      unlockedScenes: s.unlockedScenes,
      inventory: s.inventory,
      betrayalCount: s.betrayalCount,
      messages: s.messages.slice(-30),
      historySummary: s.historySummary,
      endingType: s.endingType,
      activeTab: s.activeTab,
      storyRecords: s.storyRecords.slice(-50),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  },

  loadGame: () => {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (data.version !== 1) return
      set((s) => {
        s.gameStarted = true
        s.playerName = data.playerName
        s.playerRole = data.playerRole ?? ''
        s.characters = data.characters ?? buildCharacters()
        s.currentEpisode = data.currentEpisode
        s.currentPeriodIndex = data.currentPeriodIndex
        s.actionPoints = data.actionPoints
        s.currentScene = data.currentScene
        s.currentCharacter = data.currentCharacter
        s.characterStats = data.characterStats
        s.globalStats = data.globalStats ?? { stamina: 50, iq: 50, variety: 50, score: 0 }
        s.currentChapter = data.currentChapter
        s.triggeredEvents = data.triggeredEvents
        s.unlockedScenes = data.unlockedScenes
        s.inventory = data.inventory ?? {}
        s.betrayalCount = data.betrayalCount ?? 0
        s.messages = data.messages ?? []
        s.historySummary = data.historySummary ?? ''
        s.endingType = data.endingType
        s.activeTab = data.activeTab ?? 'dialogue'
        s.storyRecords = data.storyRecords ?? []
      })
    } catch { /* corrupted save */ }
  },

  hasSave: () => !!localStorage.getItem(SAVE_KEY),

  clearSave: () => { localStorage.removeItem(SAVE_KEY) },
})))

// ── Re-export data.ts ──

export {
  SCENES, ITEMS, PERIODS, CHAPTERS,
  MAX_EPISODES, MAX_ACTION_POINTS,
  STORY_INFO, FORCED_EVENTS, ENDINGS,
  QUICK_ACTIONS, GLOBAL_STAT_METAS, ROLE_TYPES,
  buildCharacters, getCurrentChapter,
  getStatLevel, getAvailableCharacters, getDayEvents, getTrustLevel,
} from './data'

export type {
  Character, CharacterStats, Scene, GameItem, Chapter,
  ForcedEvent, Ending, TimePeriod, Message, StatMeta,
  StoryRecord, RoleType,
} from './data'
