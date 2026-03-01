/**
 * [INPUT]: opening-data.ts (PROLOGUE config)
 * [OUTPUT]: ProloguePage — 三阶段序幕（聚光灯→成员闪切→角色选择+姓名）
 * [POS]: 封面后、正片前的过渡。舞台/摄影棚原型，圈内人视角
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PROLOGUE } from '@/lib/opening-data'

interface PrologueProps {
  onComplete: (playerName: string, options?: Record<string, string>) => void
}

export default function ProloguePage({ onComplete }: PrologueProps) {
  const [phase, setPhase] = useState<'spotlight' | 'montage' | 'setup'>('spotlight')
  const [montageIndex, setMontageIndex] = useState(0)
  const [selectedRole, setSelectedRole] = useState('')
  const [playerName, setPlayerName] = useState('')

  // Auto-advance montage
  useEffect(() => {
    if (phase !== 'montage') return
    if (montageIndex >= PROLOGUE.montage.length) {
      setPhase('setup')
      return
    }
    const timer = setTimeout(() => setMontageIndex((i) => i + 1), 1800)
    return () => clearTimeout(timer)
  }, [phase, montageIndex])

  // ── Phase 1: 聚光灯 + Logo ──
  if (phase === 'spotlight') {
    return (
      <div className="rm-spotlight">
        <div className="rm-spotlight-bg" />
        <div className="rm-spotlight-sweep" />
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rm-particle"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        <motion.div
          className="rm-spotlight-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="rm-spotlight-icon">{PROLOGUE.spotlight.icon}</div>
          <div className="rm-spotlight-title">Running Man</div>
          <div className="rm-spotlight-subtitle">传奇赛季</div>
          <div className="rm-spotlight-desc">
            {PROLOGUE.spotlight.description.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </div>
          <motion.button
            className="rm-spotlight-cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            onClick={() => setPhase('montage')}
          >
            成员登场 ▸
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── Phase 2: 成员蒙太奇闪切 ──
  if (phase === 'montage') {
    const member = PROLOGUE.montage[montageIndex]
    if (!member) return null
    return (
      <div className="rm-montage">
        <AnimatePresence mode="wait">
          <motion.div
            key={montageIndex}
            className="rm-montage-slide"
            initial={{ opacity: 0, x: montageIndex % 2 === 0 ? -60 : 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: montageIndex % 2 === 0 ? 60 : -60 }}
            transition={{ duration: 0.4 }}
          >
            <img
              className="rm-montage-portrait"
              src={member.portrait}
              alt={member.name}
            />
            <div className="rm-montage-overlay" />
            <div className="rm-montage-info">
              <div className="rm-montage-name">{member.name}</div>
              <div className="rm-montage-title">{member.title}</div>
            </div>
          </motion.div>
        </AnimatePresence>
        <button className="rm-skip-btn" onClick={() => setPhase('setup')}>
          跳过 ▸
        </button>
        {/* 进度指示器 */}
        <div className="rm-montage-dots">
          {PROLOGUE.montage.map((_, i) => (
            <div
              key={i}
              className={`rm-montage-dot ${i <= montageIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Phase 3: 角色选择 + 名字输入 ──
  return (
    <div className="rm-setup">
      <motion.div
        className="rm-setup-inner"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rm-setup-badge">RUNNING MAN</div>
        <div className="rm-setup-title">选择你的类型</div>
        <div className="rm-setup-subtitle">决定你的初始属性分配</div>

        <div className="rm-role-grid">
          {PROLOGUE.roles.map((role) => (
            <button
              key={role.id}
              className={`rm-role-card ${selectedRole === role.id ? 'active' : ''}`}
              onClick={() => setSelectedRole(role.id)}
            >
              <div className="rm-role-icon">{role.icon}</div>
              <div className="rm-role-name">{role.name}</div>
              <div className="rm-role-desc">{role.desc}</div>
              <div className="rm-role-stats">
                <span className="rm-role-stat-pill">💪{role.stats.stamina}</span>
                <span className="rm-role-stat-pill">🧠{role.stats.iq}</span>
                <span className="rm-role-stat-pill">🎭{role.stats.variety}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="rm-name-section">
          <div className="rm-name-label">{PROLOGUE.nameInput.label}</div>
          <input
            className="rm-name-input"
            placeholder={PROLOGUE.nameInput.placeholder}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={PROLOGUE.nameInput.maxLength}
          />
        </div>

        <button
          className="rm-go-btn"
          disabled={!playerName.trim() || !selectedRole}
          onClick={() => onComplete(playerName.trim(), { role: selectedRole })}
        >
          {PROLOGUE.nameInput.ctaText}
        </button>
      </motion.div>
    </div>
  )
}
