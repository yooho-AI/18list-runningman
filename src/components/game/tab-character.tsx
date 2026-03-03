/**
 * [INPUT]: store.ts (useGameStore, getAvailableCharacters, getTrustLevel)
 * [OUTPUT]: TabCharacter -- 2x2角色网格(聊天按钮+mini信任条) + SVG关系图 + CharacterDossier overlay+sheet + CharacterChat
 * [POS]: 人物展示面板。角色网格 + RelationGraph + Dossier + Chat
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChatCircleDots } from '@phosphor-icons/react'
import {
  useGameStore,
  getAvailableCharacters, getTrustLevel,
  type Character, type StatMeta,
} from '../../lib/store'
import CharacterChat from './character-chat'

const P = 'rm'

// ── StatBar ──

function StatBar({ meta, value, delay = 0 }: { meta: StatMeta; value: number; delay?: number }) {
  const pct = meta.key === 'trust'
    ? Math.max(0, Math.min(100, (value + 100) / 2))
    : Math.max(0, Math.min(100, value))

  return (
    <div className={`${P}-stat-bar`}>
      <div className={`${P}-stat-bar-label`}>
        <span>{meta.icon}</span> {meta.label}
      </div>
      <div className={`${P}-stat-bar-track`}>
        <motion.div
          className={`${P}-stat-bar-fill`}
          style={{ backgroundColor: meta.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay }}
        />
      </div>
      <div className={`${P}-stat-bar-value`} style={{ color: meta.color }}>
        {value}
      </div>
    </div>
  )
}

// ── SVG Relation Graph ──

const W = 360, H = 280
const CX = W / 2, CY = H / 2
const R_RING = 100
const NODE_R = 20

function RelationGraph({ onNodeClick }: { onNodeClick: (id: string) => void }) {
  const { characters, characterStats, currentEpisode } = useGameStore()
  const available = getAvailableCharacters(currentEpisode, characters)
  const entries = Object.entries(available)

  const nodes = entries.map(([id, char], i) => {
    const angle = (Math.PI * 2 * i) / entries.length - Math.PI / 2
    return {
      id, char,
      x: CX + R_RING * Math.cos(angle),
      y: CY + R_RING * Math.sin(angle),
    }
  })

  return (
    <div className={`${P}-relation-graph`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
        {/* Connection lines */}
        {nodes.map((node) => {
          const stats = characterStats[node.id]
          const trust = stats?.trust ?? 0
          const trustInfo = getTrustLevel(trust)
          const dx = node.x - CX
          const dy = node.y - CY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const nx = dx / dist
          const ny = dy / dist
          const x1 = CX + nx * NODE_R
          const y1 = CY + ny * NODE_R
          const x2 = node.x - nx * NODE_R
          const y2 = node.y - ny * NODE_R
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2

          return (
            <g key={`line-${node.id}`}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={trustInfo.color}
                strokeWidth={1.5}
                opacity={0.4}
              />
              <rect
                x={mx - 16} y={my - 8}
                width={32} height={16}
                rx={4}
                fill="rgba(13,17,23,0.9)"
                stroke={trustInfo.color}
                strokeWidth={0.5}
              />
              <text
                x={mx} y={my + 4}
                textAnchor="middle"
                fill={trustInfo.color}
                fontSize={8}
                fontWeight={600}
              >
                {trust}
              </text>
            </g>
          )
        })}

        {/* Center node */}
        <circle cx={CX} cy={CY} r={NODE_R} fill="rgba(255,184,0,0.15)" stroke="#FFB800" strokeWidth={1.5} />
        <text x={CX} y={CY - 3} textAnchor="middle" fill="#FFB800" fontSize={14}>🏃</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="#FFB800" fontSize={8} fontWeight={600}>我</text>

        {/* NPC nodes */}
        {nodes.map((node) => (
          <g
            key={`node-${node.id}`}
            onClick={() => onNodeClick(node.id)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={node.x} cy={node.y} r={NODE_R}
              fill="rgba(255,255,255,0.05)"
              stroke={node.char.themeColor}
              strokeWidth={1.5}
            />
            <clipPath id={`clip-${node.id}`}>
              <circle cx={node.x} cy={node.y} r={NODE_R - 2} />
            </clipPath>
            <image
              href={node.char.portrait}
              x={node.x - NODE_R + 2} y={node.y - NODE_R + 2}
              width={(NODE_R - 2) * 2} height={(NODE_R - 2) * 2}
              clipPath={`url(#clip-${node.id})`}
              preserveAspectRatio="xMidYMin slice"
            />
            <text
              x={node.x}
              y={node.y + NODE_R + 12}
              textAnchor="middle"
              fill={node.char.themeColor}
              fontSize={9}
              fontWeight={600}
            >
              {node.char.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Character Dossier (overlay + sheet) ──

function CharacterDossier({
  char, stats, onClose,
}: {
  char: Character
  stats: Record<string, number>
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const trust = stats?.trust ?? 0
  const trustInfo = getTrustLevel(trust)

  return (
    <>
      <motion.div
        className={`${P}-dossier-overlay`}
        style={{ background: 'rgba(0,0,0,0.5)', overflow: 'visible' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`${P}-record-sheet`}
        style={{ zIndex: 52, overflowY: 'auto' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        <button className={`${P}-dossier-close`} onClick={onClose}>✕</button>
        <div className={`${P}-dossier-seal`}>【成员档案】</div>

        <div className={`${P}-dossier-portrait`}>
          <motion.img
            src={char.portrait}
            alt={char.name}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className={`${P}-dossier-portrait-fade`} />
        </div>

        <div className={`${P}-dossier-content ${P}-scrollbar`}>
          <h2 className={`${P}-dossier-name`} style={{ color: char.themeColor }}>
            {char.name}
          </h2>
          <p className={`${P}-dossier-title-text`}>
            {char.title} · {char.description}
          </p>

          <div className={`${P}-dossier-tags`}>
            <span className={`${P}-dossier-tag`}>{char.gender === 'male' ? '男' : '女'}</span>
            <span className={`${P}-dossier-tag`}>{char.age}岁</span>
            <span className={`${P}-dossier-tag`}>{char.title}</span>
            <span className={`${P}-dossier-tag`} style={{ color: trustInfo.color }}>
              {trustInfo.icon} {trustInfo.label}
            </span>
          </div>

          {/* Trust bar */}
          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-section-title`}>信任度</div>
            {char.statMetas.map((meta, i) => (
              <StatBar
                key={meta.key}
                meta={meta}
                value={stats[meta.key] ?? 0}
                delay={i * 0.1}
              />
            ))}
          </div>

          {/* Personality */}
          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-section-title`}>性格特征</div>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {expanded ? char.personality : char.personality.slice(0, 50)}
              {char.personality.length > 50 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#FFB800', cursor: 'pointer',
                    fontSize: 12, marginLeft: 4,
                  }}
                >
                  {expanded ? '收起' : '...展开'}
                </button>
              )}
            </p>
          </div>

          {/* Speaking style */}
          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-section-title`}>说话风格</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, fontStyle: 'italic' }}>
              "{char.speakingStyle}"
            </p>
          </div>

          {/* Trigger hints */}
          <div className={`${P}-dossier-section`}>
            <div className={`${P}-dossier-section-title`}>触发暗示</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {char.triggerPoints.map((tp, i) => (
                <span
                  key={i}
                  className={`${P}-dossier-tag`}
                  style={{ fontSize: 10 }}
                >
                  {tp.slice(0, 8)}...
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Main Component ──

export default function TabCharacter() {
  const {
    characters, characterStats, currentCharacter, currentEpisode,
    selectCharacter,
  } = useGameStore()

  const [dossierId, setDossierId] = useState<string | null>(null)
  const [chatChar, setChatChar] = useState<string | null>(null)
  const available = getAvailableCharacters(currentEpisode, characters)

  const handleCharClick = (id: string) => {
    selectCharacter(id)
    setDossierId(id)
  }

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto', padding: 12 }}>
      {/* ── 角色网格 (2x2) ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        👥 全部成员
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.entries(available).map(([id, char]) => {
          const stats = characterStats[id] ?? {}
          const trust = stats.trust ?? 0
          const trustInfo = getTrustLevel(trust)
          const pct = Math.max(0, Math.min(100, (trust + 100) / 2))
          return (
            <button
              key={id}
              onClick={() => handleCharClick(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: 10, borderRadius: 12,
                background: currentCharacter === id ? `${char.themeColor}15` : 'var(--bg-card)',
                border: `1px solid ${currentCharacter === id ? char.themeColor + '44' : 'rgba(255,184,0,0.1)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {/* 聊天按钮 */}
              <div
                onClick={(e) => { e.stopPropagation(); setChatChar(id) }}
                style={{
                  position: 'absolute', top: 6, left: 6,
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${char.themeColor}18`,
                  border: `1px solid ${char.themeColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 1,
                }}
              >
                <ChatCircleDots size={16} weight="fill" color={char.themeColor} />
              </div>
              <img
                src={char.portrait}
                alt={char.name}
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  objectFit: 'cover', objectPosition: 'center top',
                  border: `2px solid ${char.themeColor}44`,
                  marginBottom: 6,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: char.themeColor }}>
                {char.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {char.title}
              </span>
              {/* Mini trust bar */}
              <div style={{ width: '80%', height: 3, borderRadius: 2, background: 'rgba(255,184,0,0.1)' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: trustInfo.color,
                  width: `${pct}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                {trustInfo.icon} {trustInfo.label} {trust}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 关系图 ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        🕸️ 关系网络
      </h4>
      <div style={{
        padding: 12, borderRadius: 16, background: 'var(--bg-card)',
        border: '1px solid rgba(255,184,0,0.1)', marginBottom: 20,
      }}>
        <RelationGraph onNodeClick={handleCharClick} />
      </div>

      <div style={{ height: 16 }} />

      {/* Character Dossier */}
      <AnimatePresence>
        {dossierId && characters[dossierId] && (
          <CharacterDossier
            char={characters[dossierId]}
            stats={characterStats[dossierId] ?? {}}
            onClose={() => setDossierId(null)}
          />
        )}
      </AnimatePresence>

      {/* Character Chat */}
      <AnimatePresence>
        {chatChar && characters[chatChar] && (
          <CharacterChat
            charId={chatChar}
            onClose={() => setChatChar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
