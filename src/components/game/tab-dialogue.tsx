/**
 * [INPUT]: store.ts (useGameStore, SCENES, ITEMS, QUICK_ACTIONS, STORY_INFO), parser.ts
 * [OUTPUT]: TabDialogue — 对话Tab：富消息路由 + 快捷操作 + 输入区 + 背包
 * [POS]: 游戏核心交互面板。SceneCard/EpisodeCard/NPC头像气泡 + 快捷操作 + 背包
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useGameStore, SCENES, ITEMS, QUICK_ACTIONS, STORY_INFO,
  type Message,
} from '../../lib/store'
import { parseStoryParagraph } from '../../lib/parser'

const P = 'rm'

// ── Rich Message Components ──

function SceneTransitionCard({ msg }: { msg: Message }) {
  const scene = msg.sceneId ? SCENES[msg.sceneId] : null
  if (!scene) return null
  return (
    <motion.div
      className={`${P}-scene-card`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className={`${P}-scene-card-bg`}>
        <img src={scene.background} alt={scene.name} />
        <div className={`${P}-scene-card-mask`} />
      </div>
      <div className={`${P}-scene-card-info`}>
        <span className={`${P}-scene-card-badge`}>📍 场景转换</span>
        <h3>{scene.name}</h3>
        <p>{scene.atmosphere}</p>
      </div>
    </motion.div>
  )
}

function EpisodeCard({ msg }: { msg: Message }) {
  const info = msg.episodeInfo
  if (!info) return null
  const text = info.title

  return (
    <motion.div
      className={`${P}-episode-card`}
      initial={{ opacity: 0, y: -40, rotate: -5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 200 }}
    >
      <div className={`${P}-episode-card-stripe`} />
      <div className={`${P}-episode-card-body`}>
        <div className={`${P}-episode-card-number`}>
          {text.split('').map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
        <div className={`${P}-episode-card-chapter`}>{info.chapter}</div>
      </div>
    </motion.div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const { characters } = useGameStore()

  // Rich message routing
  if (msg.type === 'scene-transition') return <SceneTransitionCard msg={msg} />
  if (msg.type === 'episode-change') return <EpisodeCard msg={msg} />

  // System message
  if (msg.role === 'system') {
    return (
      <motion.div
        className={`${P}-bubble-system`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {msg.content}
      </motion.div>
    )
  }

  // Player message
  if (msg.role === 'user') {
    return (
      <motion.div
        className={`${P}-bubble-player`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {msg.content}
      </motion.div>
    )
  }

  // NPC message (assistant)
  const { narrative, statHtml, charColor } = parseStoryParagraph(msg.content)
  const char = msg.character ? characters[msg.character] : null

  return (
    <div className={`${P}-avatar-row`}>
      {char && (
        <img
          className={`${P}-npc-avatar`}
          src={char.portrait}
          alt={char.name}
          style={{ borderColor: char.themeColor }}
        />
      )}
      <div style={{ flex: 1 }}>
        {char && (
          <div className={`${P}-npc-name`} style={{ color: char.themeColor }}>
            {char.name}
          </div>
        )}
        <motion.div
          className={`${P}-bubble-npc`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={charColor ? { borderLeftColor: charColor } : undefined}
        >
          <div dangerouslySetInnerHTML={{ __html: narrative }} />
          {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
        </motion.div>
      </div>
    </div>
  )
}

// ── Inventory Sheet ──

function InventorySheet({ onClose }: { onClose: () => void }) {
  const { inventory, useItem } = useGameStore()
  const items = Object.entries(inventory).filter(([, count]) => count > 0)

  return (
    <motion.div
      className={`${P}-menu-overlay`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`${P}-inventory-sheet`}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${P}-inventory-handle`} />
        <div className={`${P}-inventory-header`}>🎒 道具背包</div>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: 13 }}>
            暂无道具
          </div>
        ) : (
          <div className={`${P}-inventory-grid`}>
            {items.map(([id, count]) => {
              const item = ITEMS[id]
              if (!item) return null
              return (
                <div
                  key={id}
                  className={`${P}-inventory-item`}
                  onClick={() => { useItem(id); onClose() }}
                >
                  <div className={`${P}-inventory-icon`}>{item.icon}</div>
                  <div>
                    <div className={`${P}-inventory-name`}>{item.name}</div>
                    <div className={`${P}-inventory-count`}>×{count}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Letter Card ──

function LetterCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        margin: '16px 0',
        padding: '20px 16px',
        background: 'rgba(255, 184, 0, 0.04)',
        border: '1px solid rgba(255, 184, 0, 0.15)',
        borderRadius: 16,
      }}
    >
      <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>🏃</div>
      <h3 style={{
        fontSize: 16, fontWeight: 700, color: '#FFB800',
        textAlign: 'center', letterSpacing: 2, marginBottom: 8,
      }}>
        {STORY_INFO.title}：{STORY_INFO.subtitle}
      </h3>
      <p style={{
        fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)',
        textAlign: 'center', marginBottom: 12,
      }}>
        {STORY_INFO.description}
      </p>
      <div style={{
        padding: '10px 12px',
        background: 'rgba(255, 184, 0, 0.06)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--text-muted)',
        lineHeight: 1.8,
      }}>
        💡 点击快捷操作或输入自由文字与成员互动。
        选择场景前往不同地点，点击人物查看信息。
        左右滑动可呼出信息面板。
      </div>
    </motion.div>
  )
}

// ── Main Component ──

export default function TabDialogue() {
  const {
    messages, isTyping, streamingContent,
    sendMessage, actionPoints,
  } = useGameStore()

  const [input, setInput] = useState('')
  const [showInventory, setShowInventory] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')
    sendMessage(text)
  }, [input, isTyping, sendMessage])

  const handleQuick = useCallback((action: string) => {
    if (isTyping) return
    sendMessage(action)
  }, [isTyping, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Area */}
      <div
        ref={chatRef}
        className={`${P}-scrollbar`}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && <LetterCard />}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Streaming bubble */}
        {isTyping && streamingContent && (() => {
          const { narrative, statHtml, charColor } = parseStoryParagraph(streamingContent)
          return (
            <motion.div
              className={`${P}-bubble-npc`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={charColor ? { borderLeftColor: charColor } : undefined}
            >
              <div dangerouslySetInnerHTML={{ __html: narrative }} />
              {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
            </motion.div>
          )
        })()}

        {/* Typing indicator */}
        {isTyping && !streamingContent && (
          <div className={`${P}-typing-indicator`}>
            <span /><span /><span />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {!isTyping && messages.length > 0 && actionPoints > 0 && (
        <div className={`${P}-quick-grid`}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              className={`${P}-quick-btn`}
              onClick={() => handleQuick(action)}
              disabled={isTyping}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className={`${P}-input-area`}>
        <button
          className={`${P}-inventory-btn`}
          onClick={() => setShowInventory(true)}
        >
          🎒
        </button>
        <input
          className={`${P}-input`}
          placeholder="说些什么..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
        />
        <button
          className={`${P}-send-btn`}
          disabled={isTyping || !input.trim()}
          onClick={handleSend}
        >
          ▸
        </button>
      </div>

      {/* Inventory Sheet */}
      <AnimatePresence>
        {showInventory && (
          <InventorySheet onClose={() => setShowInventory(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
