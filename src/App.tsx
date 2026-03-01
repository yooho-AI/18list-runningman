/**
 * [INPUT]: store.ts (useGameStore), analytics.ts (trackGameStart/Continue/PlayerCreate)
 * [OUTPUT]: 根组件：三阶段开场 + GameScreen + EndingModal + MenuOverlay
 * [POS]: React 根组件，唯一挂载点。三阶段开场(摄影棚灯光→成员闪切→角色选择+姓名输入)
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore, ENDINGS, ROLE_TYPES, STORY_INFO } from './lib/store'
import { trackGameStart, trackGameContinue, trackPlayerCreate } from './lib/analytics'
import AppShell from './components/game/app-shell'
import './styles/globals.css'
import './styles/opening.css'
import './styles/rich-cards.css'

const P = 'rm'

// ── Characters for montage ──

const MONTAGE_MEMBERS = [
  { name: '刘在石', title: '国民MC', portrait: '/characters/jaesuk.jpg' },
  { name: '金钟国', title: '能力者', portrait: '/characters/jongkook.jpg' },
  { name: 'HAHA', title: '氛围担当', portrait: '/characters/haha.jpg' },
  { name: '宋智孝', title: 'ACE', portrait: '/characters/jihyo.jpg' },
  { name: '李光洙', title: '亚洲王子', portrait: '/characters/kwangsoo.jpg' },
  { name: '池石镇', title: '大哥', portrait: '/characters/sukjin.jpg' },
  { name: '全昭旻', title: '综艺小魔女', portrait: '/characters/somin.jpg' },
  { name: '梁世灿', title: '综艺陀螺', portrait: '/characters/sechan.jpg' },
]

// ── StartScreen: 3-phase opening ──

function StartScreen() {
  const { initGame, setPlayerInfo, loadGame, hasSave } = useGameStore()
  const saved = hasSave()
  const [phase, setPhase] = useState<'logo' | 'montage' | 'setup'>('logo')
  const [montageIndex, setMontageIndex] = useState(0)
  const [selectedRole, setSelectedRole] = useState('')
  const [playerName, setPlayerName] = useState('')

  // Montage: cycle through members
  useEffect(() => {
    if (phase !== 'montage') return
    if (montageIndex >= MONTAGE_MEMBERS.length) {
      setPhase('setup')
      return
    }
    const timer = setTimeout(() => setMontageIndex((i) => i + 1), 1800)
    return () => clearTimeout(timer)
  }, [phase, montageIndex])

  const handleStart = useCallback(() => {
    trackGameStart()
    setPhase('montage')
  }, [])

  const handleContinue = useCallback(() => {
    trackGameContinue()
    loadGame()
  }, [loadGame])

  const handleGo = useCallback(() => {
    if (!playerName.trim() || !selectedRole) return
    setPlayerInfo(playerName.trim(), selectedRole)
    trackPlayerCreate(playerName.trim(), selectedRole)
    initGame()
  }, [playerName, selectedRole, setPlayerInfo, initGame])

  // ── Phase 1: Logo + Spotlight ──
  if (phase === 'logo') {
    return (
      <div className={`${P}-start`}>
        <div className="rm-spotlight-bg" />
        <div className="rm-spotlight-sweep" />
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rm-particle" style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
        <div className="rm-logo-area">
          <div className="rm-logo-icon">🏃</div>
          <div className="rm-logo-title">{STORY_INFO.title}</div>
          <div className="rm-logo-subtitle">{STORY_INFO.subtitle}</div>
          <div className="rm-logo-desc">
            风靡亚洲的真人竞技综艺，15期终极生存挑战！与刘在石、金钟国等传奇成员一起奔跑吧！
          </div>
          <button className="rm-start-btn" onClick={handleStart}>
            开 始 录 制
          </button>
          {saved && (
            <button className="rm-continue-btn" onClick={handleContinue}>
              继续上次录制
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Phase 2: Member Montage ──
  if (phase === 'montage') {
    const member = MONTAGE_MEMBERS[montageIndex]
    if (!member) return null
    return (
      <div className="rm-montage">
        <AnimatePresence mode="wait">
          <motion.div
            key={montageIndex}
            className="rm-montage-portrait"
            initial={{ opacity: 0, x: montageIndex % 2 === 0 ? -60 : 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: montageIndex % 2 === 0 ? 60 : -60 }}
            transition={{ duration: 0.4 }}
          >
            <img src={member.portrait} alt={member.name} />
            <div className="rm-montage-name">{member.name}</div>
            <div className="rm-montage-title">{member.title}</div>
          </motion.div>
        </AnimatePresence>
        <button className="rm-skip-btn" onClick={() => setPhase('setup')}>
          跳过 ▸
        </button>
      </div>
    )
  }

  // ── Phase 3: Role Selection + Name Input ──
  return (
    <div className="rm-setup">
      <div className="rm-setup-inner">
        <div className="rm-setup-title">选择你的类型</div>
        <div className="rm-setup-subtitle">决定你的初始属性分配</div>

        <div className="rm-role-grid">
          {ROLE_TYPES.map((role) => (
            <button
              key={role.id}
              className={`rm-role-card ${selectedRole === role.id ? 'active' : ''}`}
              onClick={() => setSelectedRole(role.id)}
            >
              <div className="rm-role-icon">{role.icon}</div>
              <div className="rm-role-name">{role.name}</div>
              <div className="rm-role-desc">{role.description}</div>
              <div className="rm-role-stats">
                <span className="rm-role-stat-pill">💪{role.initialStats.stamina}</span>
                <span className="rm-role-stat-pill">🧠{role.initialStats.iq}</span>
                <span className="rm-role-stat-pill">🎭{role.initialStats.variety}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="rm-name-section">
          <div className="rm-name-label">你的艺名</div>
          <input
            className="rm-name-input"
            placeholder="输入你的名字"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={10}
          />
        </div>

        <button
          className="rm-go-btn"
          disabled={!playerName.trim() || !selectedRole}
          onClick={handleGo}
        >
          开始录制 ▸
        </button>
      </div>
    </div>
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
            className="rm-start-btn"
            style={{ fontSize: 14, padding: '10px 32px' }}
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

  if (!gameStarted) return <StartScreen />

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
