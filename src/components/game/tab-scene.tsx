/**
 * [INPUT]: store.ts (useGameStore, SCENES)
 * [OUTPUT]: TabScene — 场景Tab：9:16大图 + 地点列表
 * [POS]: 场景展示面板。当前场景大图 + 所有地点网格（角色列表只在人物Tab）
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import {
  useGameStore, SCENES,
} from '../../lib/store'

const P = 'rm'

export default function TabScene() {
  const {
    currentScene, unlockedScenes, selectScene,
  } = useGameStore()

  const scene = SCENES[currentScene]
  const scenes = Object.values(SCENES)

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto' }}>
      {/* Scene Hero */}
      {scene && (
        <div className={`${P}-scene-hero`}>
          <img src={scene.background} alt={scene.name} />
          <div className={`${P}-scene-hero-overlay`}>
            <div style={{
              display: 'inline-block',
              padding: '2px 10px',
              background: '#FFB800',
              color: '#0d1117',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 2,
              letterSpacing: 1,
              marginBottom: 6,
            }}>
              {scene.icon} 当前场景
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              {scene.name}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              {scene.description}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: 4 }}>
              {scene.atmosphere}
            </p>
          </div>
        </div>
      )}

      {/* All Locations */}
      <div style={{ padding: '16px 16px 24px' }}>
        <div className={`${P}-stat-group`}>📍 所有场景</div>
        <div className={`${P}-char-grid`} style={{ padding: 0 }}>
          {scenes.map((s) => {
            const unlocked = unlockedScenes.includes(s.id)
            const isCurrent = currentScene === s.id
            return (
              <button
                key={s.id}
                className={`${P}-char-tag`}
                style={{
                  borderColor: isCurrent ? '#FFB800' : undefined,
                  background: isCurrent ? 'rgba(255, 184, 0, 0.1)' : undefined,
                  opacity: unlocked ? 1 : 0.35,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                }}
                disabled={!unlocked}
                onClick={() => {
                  if (unlocked && !isCurrent) selectScene(s.id)
                }}
              >
                <span style={{ fontSize: 24 }}>{unlocked ? s.icon : '🔒'}</span>
                <div className={`${P}-char-tag-info`}>
                  <div className={`${P}-char-tag-name`}>{s.name}</div>
                  <div className={`${P}-char-tag-title`}>
                    {s.tags.join(' · ')}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
