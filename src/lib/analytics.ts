/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 track* 系列埋点函数
 * [POS]: Umami 埋点层，被 store.ts 和 App.tsx 消费
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

const PREFIX = 'rm_'

function trackEvent(name: string, data?: Record<string, string | number>) {
  try {
    ;(window as unknown as Record<string, unknown>).umami &&
      (window as unknown as { umami: { track: (n: string, d?: Record<string, string | number>) => void } }).umami.track(PREFIX + name, data)
  } catch { /* silent */ }
}

// ── 通用事件 ──
export const trackGameStart = () => trackEvent('game_start')
export const trackGameContinue = () => trackEvent('game_continue')
export const trackPlayerCreate = (name: string, role: string) =>
  trackEvent('player_create', { name, role })
export const trackTimeAdvance = (episode: number, period: string) =>
  trackEvent('time_advance', { episode, period })
export const trackChapterEnter = (chapter: number) =>
  trackEvent('chapter_enter', { chapter })
export const trackEndingReached = (ending: string) =>
  trackEvent('ending_reached', { ending })

// ── 条件事件 ──
export const trackSceneUnlock = (scene: string) =>
  trackEvent('scene_unlock', { scene })
export const trackBetrayalAttempt = (success: boolean) =>
  trackEvent('betrayal', { success: success ? 1 : 0 })
export const trackAllianceFormed = (partner: string) =>
  trackEvent('alliance', { partner })
