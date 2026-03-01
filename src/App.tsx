/**
 * [INPUT]: store.ts (useGameStore), analytics.ts, CoverPage, ProloguePage
 * [OUTPUT]: 根组件：封面 → 序幕 → 正片 + EndingModal + MenuOverlay
 * [POS]: React 根组件，唯一挂载点。流程：Cover → Prologue(聚光灯→闪切→角色选择) → Main Game
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore, ENDINGS } from './lib/store'
import { trackGameContinue } from './lib/analytics'
import CoverPage from './components/opening/CoverPage'
import AppShell from './components/game/app-shell'
import './styles/globals.css'
import './styles/cover.css'
import './styles/prologue.css'
import './styles/rich-cards.css'

const P = 'rm'

// ── OpeningScreen: Cover → Prologue ──

function OpeningScreen() {
  const { loadGame, hasSave } = useGameStore()

  return (
    <CoverPage
      hasSave={hasSave()}
      onNewGame={() => {
        window.open('https://yooho.ai/login', '_blank')
      }}
      onContinue={() => {
        trackGameContinue()
        loadGame()
      }}
    />
  )
}

// ── EndingModal ──

const ENDING_TYPE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  TE: { label: 'True Ending', color: '#ffd700', icon: '👑' },
  HE: { label: 'Happy Ending', color: '#22c55e', icon: '🏆' },
  SE: { label: 'Special Ending', color: '#a78bfa', icon: '✨' },
  BE: { label: 'Bad Ending', color: '#64748b', icon: '💔' },
  NE: { label: 'Normal Ending', color: '#eab308', icon: '🌙' },
}

function EndingModal() {
  const { endingType, resetGame, clearSave } = useGameStore()
  if (!endingType) return null

  const ending = ENDINGS.find((e) => e.id === endingType)
  if (!ending) return null
  const meta = ENDING_TYPE_MAP[ending.type] ?? ENDING_TYPE_MAP.NE

  return (
    <AnimatePresence>
      <motion.div
        className={`${P}-ending-overlay`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className={`${P}-ending-modal`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>{meta.icon}</div>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              background: `${meta.color}20`,
              color: meta.color,
              marginBottom: 16,
            }}
          >
            {meta.label}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: meta.color }}>
            {ending.name}
          </h2>
          <p style={{
            fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)',
            marginBottom: 24, maxWidth: 300,
          }}>
            {ending.description}
          </p>
          <button
            className={`${P}-ending-restart`}
            onClick={() => { clearSave(); resetGame() }}
          >
            重新开始
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── MenuOverlay ──

function MenuOverlay({ onClose }: { onClose: () => void }) {
  const { saveGame, loadGame, resetGame, clearSave, hasSave } = useGameStore()
  const [toast, setToast] = useState('')

  const handleSave = () => {
    saveGame()
    setToast('✅ 已保存')
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <motion.div
      className={`${P}-menu-overlay`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${P}-menu-sheet`}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${P}-menu-handle`} />
        <button className={`${P}-menu-btn`} onClick={handleSave}>
          💾 保存游戏
        </button>
        {hasSave() && (
          <button className={`${P}-menu-btn`} onClick={() => { loadGame(); onClose() }}>
            📂 读取存档
          </button>
        )}
        <button
          className={`${P}-menu-btn danger`}
          onClick={() => { clearSave(); resetGame(); onClose() }}
        >
          🔄 重新开始
        </button>
        <button className={`${P}-menu-btn`} onClick={onClose}>
          ▸ 继续游戏
        </button>
      </motion.div>
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
    </motion.div>
  )
}

// ── App Root ──

export default function App() {
  const { gameStarted } = useGameStore()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!gameStarted) return <OpeningScreen />

  return (
    <>
      <AppShell onMenuOpen={() => setMenuOpen(true)} />
      <AnimatePresence>
        {menuOpen && <MenuOverlay onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
      <EndingModal />
    </>
  )
}
