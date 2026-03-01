/**
 * [INPUT]: 依赖 opening-data.ts 的 COVER 配置
 * [OUTPUT]: 对外提供 CoverPage 封面组件
 * [POS]: 游戏封面：视频背景 + 综艺海报风排版 + 开始/继续按钮
 * [PROTOCOL]: ☆ 零修改模板 — 从 skill 复制，不要手动编辑
 */

import { motion } from 'framer-motion'
import { COVER } from '@/lib/opening-data'

interface Props {
  hasSave: boolean
  onNewGame: () => void
  onContinue: () => void
}

export default function CoverPage({ hasSave, onNewGame, onContinue }: Props) {
  return (
    <div className="cover">
      <video
        className="cover-video"
        src={COVER.video}
        autoPlay
        muted
        loop
        playsInline
        poster={COVER.poster}
      />
      <div className="cover-overlay" />
      <motion.div
        className="cover-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="cover-line" />
        <div className="cover-logo">{COVER.title}</div>
        {COVER.subtitle && <div className="cover-sub">{COVER.subtitle}</div>}
        {COVER.slogan && <div className="cover-slogan">{COVER.slogan}</div>}
        <div className="cover-actions">
          <button className="cover-start" onClick={onNewGame}>
            开始游戏
          </button>
          {hasSave && (
            <button className="cover-continue" onClick={onContinue}>
              继续游戏
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
