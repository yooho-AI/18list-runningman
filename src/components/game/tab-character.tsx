/**
 * [INPUT]: store.ts (useGameStore, GLOBAL_STAT_METAS, getAvailableCharacters, getTrustLevel)
 * [OUTPUT]: TabCharacter — 人物Tab：立绘+属性+关系图+角色网格+全屏档案
 * [POS]: 人物展示面板。PortraitHero + StatBars + RelationGraph + CharacterGrid + Dossier
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useGameStore, GLOBAL_STAT_METAS,
  getAvailableCharacters, getTrustLevel,
  type Character, type StatMeta,
} from '../../lib/store'

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

// ── Character Dossier ──

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
    <motion.div
      className={`${P}-dossier-overlay`}
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
  )
}

// ── Main Component ──

export default function TabCharacter() {
  const {
    characters, characterStats, currentCharacter, currentEpisode, globalStats,
    selectCharacter,
  } = useGameStore()

  const [dossierId, setDossierId] = useState<string | null>(null)
  const available = getAvailableCharacters(currentEpisode, characters)
  const currentChar = currentCharacter ? characters[currentCharacter] : null
  const currentStats = currentCharacter ? characterStats[currentCharacter] : null

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto' }}>
      {/* Portrait Hero */}
      {currentChar && (
        <div
          className={`${P}-portrait-hero`}
          onClick={() => setDossierId(currentChar.id)}
          style={{ cursor: 'pointer' }}
        >
          <img src={currentChar.portrait} alt={currentChar.name} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '24px 16px 12px',
            background: 'linear-gradient(transparent, rgba(13, 17, 23, 0.95))',
          }}>
            <div style={{
              fontSize: 22, fontWeight: 800,
              color: currentChar.themeColor,
            }}>
              {currentChar.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {currentChar.title} · {currentChar.description}
            </div>
          </div>
        </div>
      )}

      {!currentChar && (
        <div style={{
          padding: '40px 16px', textAlign: 'center',
          color: 'var(--text-muted)', fontSize: 14,
        }}>
          选择一位成员查看详情
        </div>
      )}

      {/* Global Stats */}
      <div style={{ padding: '8px 0' }}>
        <div className={`${P}-stat-group`}>📊 个人属性</div>
        {GLOBAL_STAT_METAS.map((meta, i) => (
          <StatBar
            key={meta.key}
            meta={meta}
            value={globalStats[meta.key as keyof typeof globalStats] ?? 0}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* Current character trust */}
      {currentChar && currentStats && (
        <div style={{ padding: '0' }}>
          <div className={`${P}-stat-group`}>🤝 与{currentChar.name}的关系</div>
          {currentChar.statMetas.map((meta, i) => (
            <StatBar
              key={meta.key}
              meta={meta}
              value={currentStats[meta.key] ?? 0}
              delay={i * 0.1}
            />
          ))}
        </div>
      )}

      {/* Relation Graph */}
      <div style={{ padding: '8px 16px' }}>
        <div className={`${P}-stat-group`} style={{ padding: 0 }}>🕸️ 关系网络</div>
        <RelationGraph onNodeClick={(id) => {
          selectCharacter(id)
          setDossierId(id)
        }} />
      </div>

      {/* Relation Cards */}
      <div style={{ padding: '0 16px' }}>
        <div className={`${P}-stat-group`} style={{ padding: 0 }}>👥 全部成员</div>
        {Object.entries(available).map(([id, char]) => {
          const stats = characterStats[id]
          const trust = stats?.trust ?? 0
          const trustInfo = getTrustLevel(trust)
          return (
            <div
              key={id}
              className={`${P}-relation-card`}
              onClick={() => {
                selectCharacter(id)
                setDossierId(id)
              }}
            >
              <img
                className={`${P}-relation-avatar`}
                src={char.portrait}
                alt={char.name}
                style={{ borderColor: char.themeColor }}
              />
              <div className={`${P}-relation-info`}>
                <div className={`${P}-relation-name`} style={{ color: char.themeColor }}>
                  {char.name}
                </div>
                <div className={`${P}-relation-label`}>{char.title}</div>
              </div>
              <div className={`${P}-relation-value`} style={{ color: trustInfo.color }}>
                {trustInfo.icon} {trust}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ height: 24 }} />

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
    </div>
  )
}
