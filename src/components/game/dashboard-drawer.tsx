/**
 * [INPUT]: store.ts (useGameStore, GLOBAL_STAT_METAS, SCENES, ITEMS, getCurrentChapter, getTrustLevel)
 * [OUTPUT]: DashboardDrawer — 左侧滑入信息抽屉，Reorder 拖拽排序
 * [POS]: 练习生手帐。扉页+成员轮播+场景网格+任务目标+道具+排名+Reorder拖拽
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState, useEffect } from 'react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import {
  useGameStore, PERIODS, GLOBAL_STAT_METAS, SCENES, ITEMS,
  getCurrentChapter, getAvailableCharacters, getTrustLevel,
} from '../../lib/store'

const P = 'rm'
const ORDER_KEY = 'rm-dash-order'
const DEFAULT_ORDER = ['members', 'scenes', 'objectives', 'inventory', 'ranking']

// ── Drag wrapper ──

function DashSection({ id, children }: { id: string; children: React.ReactNode }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controls}>
      <div className={`${P}-dash-reorder`}>
        <div className={`${P}-dash-grip`} onPointerDown={(e) => controls.start(e)}>⠿</div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </Reorder.Item>
  )
}

// ── FrontPage: 期数/时段/章节/积分 ──

function FrontPage() {
  const { currentEpisode, currentPeriodIndex, globalStats } = useGameStore()
  const chapter = getCurrentChapter(currentEpisode)
  const period = PERIODS[currentPeriodIndex]

  return (
    <div className={`${P}-dash-frontpage`}>
      <div className={`${P}-dash-stat-card`}>
        <div className={`${P}-dash-stat-label`}>期数</div>
        <div className={`${P}-dash-stat-value`}>{currentEpisode}/15</div>
      </div>
      <div className={`${P}-dash-stat-card`}>
        <div className={`${P}-dash-stat-label`}>时段</div>
        <div className={`${P}-dash-stat-value`}>{period?.icon} {period?.name}</div>
      </div>
      <div className={`${P}-dash-stat-card`}>
        <div className={`${P}-dash-stat-label`}>章节</div>
        <div className={`${P}-dash-stat-value`} style={{ fontSize: 14 }}>{chapter.name}</div>
      </div>
      <div className={`${P}-dash-stat-card`}>
        <div className={`${P}-dash-stat-label`}>⭐ 积分</div>
        <div className={`${P}-dash-stat-value`}>{globalStats.score}</div>
      </div>
    </div>
  )
}

// ── Member Carousel ──

const SLIDE_VARIANTS = {
  enter: (d: number) => ({ x: d > 0 ? 260 : -260, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 260 : -260, opacity: 0 }),
}

function MemberCarousel({ onClose }: { onClose: () => void }) {
  const { characters, characterStats, currentEpisode, selectCharacter, setActiveTab } = useGameStore()
  const available = getAvailableCharacters(currentEpisode, characters)
  const entries = Object.entries(available)
  const [[page, direction], setPage] = useState([0, 0])

  const paginate = (d: number) => {
    setPage(([p]) => {
      const next = (p + d + entries.length) % entries.length
      return [next, d]
    })
  }

  const touchRef = useState<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => { touchRef[1](e.touches[0].clientX) }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchRef[0] === null) return
    const dx = e.changedTouches[0].clientX - touchRef[0]
    touchRef[1](null)
    if (dx < -50) paginate(1)
    else if (dx > 50) paginate(-1)
  }

  if (entries.length === 0) return null
  const [charId, char] = entries[page]
  const stats = characterStats[charId]
  const trust = stats?.trust ?? 0
  const trustInfo = getTrustLevel(trust)

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>🏃 成员</div>
      <div
        className={`${P}-dash-member-carousel`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={page}
            className={`${P}-dash-member-card`}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: 'easeInOut' }}
            onClick={() => {
              selectCharacter(charId)
              setActiveTab('character')
              onClose()
            }}
            style={{ cursor: 'pointer' }}
          >
            <img
              className={`${P}-dash-member-portrait`}
              src={char.portrait}
              alt={char.name}
            />
            <div className={`${P}-dash-member-info`}>
              <div className={`${P}-dash-member-name`} style={{ color: char.themeColor }}>
                {char.name}
              </div>
              <div className={`${P}-dash-member-title`}>{char.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 13 }}>{trustInfo.icon}</span>
                <span style={{ fontSize: 12, color: trustInfo.color, fontWeight: 600 }}>
                  {trustInfo.label} ({trust})
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className={`${P}-dash-dots`}>
        {entries.map((_, i) => (
          <div
            key={i}
            className={`${P}-dash-dot ${i === page ? 'active' : ''}`}
            onClick={() => setPage([i, i > page ? 1 : -1])}
          />
        ))}
      </div>
    </div>
  )
}

// ── Scene Grid ──

function SceneGrid({ onClose }: { onClose: () => void }) {
  const { unlockedScenes, currentScene, selectScene } = useGameStore()
  const scenes = Object.values(SCENES)

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>🗺️ 场景</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {scenes.map((scene) => {
          const unlocked = unlockedScenes.includes(scene.id)
          const isCurrent = currentScene === scene.id
          return (
            <button
              key={scene.id}
              onClick={() => {
                if (unlocked && !isCurrent) {
                  selectScene(scene.id)
                  onClose()
                }
              }}
              disabled={!unlocked}
              style={{
                padding: '8px 4px',
                background: isCurrent
                  ? 'rgba(255, 184, 0, 0.15)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isCurrent ? '#FFB800' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: 8,
                color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 11,
                cursor: unlocked ? 'pointer' : 'not-allowed',
                opacity: unlocked ? 1 : 0.4,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>
                {unlocked ? scene.icon : '🔒'}
              </div>
              <div>{scene.name}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Objectives ──

function Objectives() {
  const { currentEpisode } = useGameStore()
  const chapter = getCurrentChapter(currentEpisode)

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>🎯 当前目标</div>
      {chapter.objectives.map((obj, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 0', fontSize: 12, color: 'var(--text-secondary)',
        }}>
          <span style={{
            width: 16, height: 16, borderRadius: 4,
            border: '1px solid rgba(255, 184, 0, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, flexShrink: 0,
          }}>
            ○
          </span>
          {obj}
        </div>
      ))}
    </div>
  )
}

// ── Inventory ──

function InventorySection() {
  const { inventory } = useGameStore()
  const items = Object.entries(inventory).filter(([, count]) => count > 0)

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>🎒 道具</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>
          暂无道具
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.map(([id, count]) => {
            const item = ITEMS[id]
            if (!item) return null
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                background: 'rgba(255, 184, 0, 0.06)',
                border: '1px solid rgba(255, 184, 0, 0.15)',
                borderRadius: 8, fontSize: 12,
              }}>
                {item.icon} {item.name} ×{count}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Ranking ──

function RankingPreview() {
  const { globalStats } = useGameStore()

  return (
    <div className={`${P}-dash-section`}>
      <div className={`${P}-dash-section-title`}>📊 属性概览</div>
      <div className={`${P}-dash-ranking`}>
        {GLOBAL_STAT_METAS.map((meta) => {
          const value = globalStats[meta.key as keyof typeof globalStats] ?? 0
          return (
            <div key={meta.key} className={`${P}-dash-rank-item`}>
              <span style={{ fontSize: 16 }}>{meta.icon}</span>
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{meta.label}</span>
              <span style={{ fontWeight: 700, color: meta.color }}>{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ──

export default function DashboardDrawer({ onClose }: { onClose: () => void }) {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(ORDER_KEY)
      if (s) {
        const arr = JSON.parse(s) as string[]
        if (DEFAULT_ORDER.every((k) => arr.includes(k))) return arr
      }
    } catch { /* noop */ }
    return [...DEFAULT_ORDER]
  })

  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order))
  }, [order])

  const renderSection = (key: string) => {
    switch (key) {
      case 'members': return <MemberCarousel onClose={onClose} />
      case 'scenes': return <SceneGrid onClose={onClose} />
      case 'objectives': return <Objectives />
      case 'inventory': return <InventorySection />
      case 'ranking': return <RankingPreview />
      default: return null
    }
  }

  return (
    <motion.div
      className={`${P}-dash-overlay`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${P}-dash-drawer`}
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${P}-dash-header`}>
          <div className={`${P}-dash-title`}>📓 成员手册</div>
          <div className={`${P}-dash-subtitle`}>Running Man · 传奇赛季</div>
          <button className={`${P}-dash-close`} onClick={onClose}>✕</button>
        </div>

        <div className={`${P}-dash-scroll ${P}-scrollbar`}>
          <FrontPage />

          <Reorder.Group
            axis="y"
            values={order}
            onReorder={setOrder}
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {order.map((key) => (
              <DashSection key={key} id={key}>
                {renderSection(key)}
              </DashSection>
            ))}
          </Reorder.Group>
        </div>
      </motion.div>
    </motion.div>
  )
}
