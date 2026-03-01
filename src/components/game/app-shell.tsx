/**
 * [INPUT]: store.ts (useGameStore), bgm.ts, dashboard-drawer, tab-*
 * [OUTPUT]: AppShell — 居中壳 + Header + Tab路由 + TabBar + 三向手势 + 抽屉 + Toast
 * [POS]: 游戏主布局唯一入口，零分叉。桌面430px居中壳 + 移动端全屏
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore, PERIODS, getCurrentChapter } from '../../lib/store'
import { useBgm } from '../../lib/bgm'
import {
  MapTrifold, ChatCircleDots, Users,
  Notebook, Scroll, MusicNotes, SpeakerSimpleSlash,
  List,
} from '@phosphor-icons/react'
import DashboardDrawer from './dashboard-drawer'
import TabDialogue from './tab-dialogue'
import TabScene from './tab-scene'
import TabCharacter from './tab-character'

const P = 'rm'

const TAB_CONFIG = [
  { key: 'scene' as const, Icon: MapTrifold, label: '场景' },
  { key: 'dialogue' as const, Icon: ChatCircleDots, label: '对话' },
  { key: 'character' as const, Icon: Users, label: '人物' },
]

function BgmToggle() {
  const { isPlaying, toggle } = useBgm()
  return (
    <button className={`${P}-header-btn`} onClick={(e) => toggle(e)}>
      {isPlaying ? <MusicNotes size={18} weight="fill" /> : <SpeakerSimpleSlash size={18} />}
    </button>
  )
}

function RecordSheet({ onClose }: { onClose: () => void }) {
  const { storyRecords } = useGameStore()
  return (
    <motion.div
      className={`${P}-dash-overlay`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${P}-record-sheet`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${P}-record-header`}><Scroll size={16} weight="fill" /> 事件记录</div>
        <div className={`${P}-record-timeline`}>
          {[...storyRecords].reverse().map((rec) => (
            <div key={rec.id} className={`${P}-record-item`}>
              <div className={`${P}-record-dot`} />
              <div className={`${P}-record-body`}>
                <div className={`${P}-record-meta`}>
                  第{rec.day}期 · {rec.period}
                </div>
                <div className={`${P}-record-title`}>{rec.title}</div>
                <div className={`${P}-record-content`}>{rec.content}</div>
              </div>
            </div>
          ))}
          {storyRecords.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 13 }}>
              暂无记录
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AppShell({ onMenuOpen }: { onMenuOpen: () => void }) {
  const {
    activeTab, setActiveTab,
    currentEpisode, currentPeriodIndex,
    showDashboard, toggleDashboard,
    showRecords, toggleRecords,
  } = useGameStore()

  const chapter = getCurrentChapter(currentEpisode)
  const period = PERIODS[currentPeriodIndex]

  const [toast] = useState('')
  const touchRef = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current || showDashboard || showRecords) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    touchRef.current = null
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (dx > 0) toggleDashboard()
    else toggleRecords()
  }, [showDashboard, showRecords, toggleDashboard, toggleRecords])

  return (
    <div className={`${P}-shell`}>
      {/* Header */}
      <header className={`${P}-header`}>
        <div className={`${P}-header-left`}>
          <button className={`${P}-header-btn`} onClick={toggleDashboard}><Notebook size={18} /></button>
          <span className={`${P}-header-time`}>
            {period?.icon} 第{currentEpisode}期 · {period?.name}
          </span>
        </div>
        <div className={`${P}-header-center`}>
          <span className={`${P}-header-chapter`}>{chapter.name}</span>
        </div>
        <div className={`${P}-header-right`}>
          <BgmToggle />
          <button className={`${P}-header-btn`} onClick={onMenuOpen}><List size={18} /></button>
          <button className={`${P}-header-btn`} onClick={toggleRecords}><Scroll size={18} /></button>
        </div>
      </header>

      {/* Tab Content */}
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            style={{ height: '100%', overflow: 'hidden' }}
          >
            {activeTab === 'dialogue' && <TabDialogue />}
            {activeTab === 'scene' && <TabScene />}
            {activeTab === 'character' && <TabCharacter />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tab Bar */}
      <nav className={`${P}-tab-bar`}>
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            className={`${P}-tab-item ${activeTab === tab.key ? `${P}-tab-active` : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.Icon size={20} weight={activeTab === tab.key ? 'fill' : 'regular'} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Dashboard Drawer */}
      <AnimatePresence>
        {showDashboard && <DashboardDrawer onClose={toggleDashboard} />}
      </AnimatePresence>

      {/* Record Sheet */}
      <AnimatePresence>
        {showRecords && <RecordSheet onClose={toggleRecords} />}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`${P}-toast`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
