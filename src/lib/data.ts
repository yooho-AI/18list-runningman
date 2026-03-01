/**
 * [INPUT]: None (no external dependencies)
 * [OUTPUT]: All type definitions + constants + characters/scenes/items/chapters/events/endings + utility functions
 * [POS]: lib UI thin layer, consumed by store.ts and all components. Narrative content lives in script.md
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

// ── 类型定义 ──

export interface TimePeriod {
  index: number
  name: string
  icon: string
  hours: string
}

export interface StatMeta {
  key: string
  label: string
  color: string
  icon: string
  category: 'relation' | 'status' | 'skill'
  autoIncrement?: number
  decayRate?: number
}

export type CharacterStats = Record<string, number>

export interface Character {
  id: string
  name: string
  portrait: string
  gender: 'female' | 'male'
  age: number
  title: string
  description: string
  personality: string
  speakingStyle: string
  secret: string
  triggerPoints: string[]
  behaviorPatterns: string
  themeColor: string
  joinEpisode: number
  statMetas: StatMeta[]
  initialStats: CharacterStats
}

export interface Scene {
  id: string
  name: string
  icon: string
  description: string
  background: string
  atmosphere: string
  tags: string[]
  unlockCondition?: {
    event?: string
    stat?: { charId: string; key: string; min: number }
  }
}

export interface GameItem {
  id: string
  name: string
  icon: string
  type: 'reward' | 'strategy' | 'boost' | 'special'
  description: string
  maxCount?: number
}

export interface Chapter {
  id: number
  name: string
  dayRange: [number, number]
  description: string
  objectives: string[]
  atmosphere: string
}

export interface ForcedEvent {
  id: string
  name: string
  triggerDay: number
  triggerPeriod?: number
  description: string
}

export interface Ending {
  id: string
  name: string
  type: 'TE' | 'HE' | 'NE' | 'BE' | 'SE'
  description: string
  condition: string
}

export interface StoryRecord {
  id: string
  day: number
  period: string
  title: string
  content: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  character?: string
  timestamp: number
  type?: 'scene-transition' | 'episode-change' | 'score-update'
  sceneId?: string
  episodeInfo?: { episode: number; title: string; chapter: string }
}

// ── 常量 ──

export const PERIODS: TimePeriod[] = [
  { index: 0, name: '上午', icon: '☀️', hours: '09:00-12:00' },
  { index: 1, name: '下午', icon: '🌤️', hours: '13:00-17:00' },
  { index: 2, name: '晚上', icon: '🌙', hours: '18:00-22:00' },
]

export const MAX_EPISODES = 15
export const MAX_ACTION_POINTS = 3

// ── 角色信任度 StatMeta（共享模板） ──

const TRUST_META: StatMeta = {
  key: 'trust', label: '信任度', color: '#22c55e', icon: '🤝', category: 'relation',
}

// ── 角色定义 ──

const YOO_JAESUK: Character = {
  id: 'jaesuk',
  name: '刘在石',
  portrait: '/characters/jaesuk.jpg',
  gender: 'male',
  age: 52,
  title: '国民MC',
  description: '综艺节目最精明的策略家',
  personality: '温暖大哥形象下的精明策略家',
  speakingStyle: '温和有力，善于总结和引导',
  secret: '理想冠军是最能代表RM精神的人',
  triggerPoints: ['信任度≥70解锁MC指导', '第2期密谋事件'],
  behaviorPatterns: '用玩笑化解危机也制造机会',
  themeColor: '#3b82f6',
  joinEpisode: 1,
  statMetas: [TRUST_META],
  initialStats: { trust: 30 },
}

const KIM_JONGKOOK: Character = {
  id: 'jongkook',
  name: '金钟国',
  portrait: '/characters/jongkook.jpg',
  gender: 'male',
  age: 48,
  title: '能力者',
  description: '绝对实力的体力担当',
  personality: '外表强硬霸道，内心重义气',
  speakingStyle: '低沉有力，简短直接',
  secret: '最享受和大家一起拼搏的过程',
  triggerPoints: ['信任度≥80解锁能力者认证', '体力≥80合作压制'],
  behaviorPatterns: '对强者尊重、对弱者保护、对背叛者毫不留情',
  themeColor: '#dc2626',
  joinEpisode: 1,
  statMetas: [TRUST_META],
  initialStats: { trust: 20 },
}

const HAHA_CHAR: Character = {
  id: 'haha',
  name: 'HAHA',
  portrait: '/characters/haha.jpg',
  gender: 'male',
  age: 45,
  title: '氛围担当',
  description: '最敏锐的观察者',
  personality: '疯癫外表下的敏锐观察力',
  speakingStyle: '高亢活泼，善于模仿和起外号',
  secret: '最害怕朋友之间真的反目',
  triggerPoints: ['信任度≥60解锁情报网', '与刘在石双≥50触发蚂蚱联盟'],
  behaviorPatterns: '用搞笑掩盖智慧，关键时做出正确选择',
  themeColor: '#f59e0b',
  joinEpisode: 1,
  statMetas: [TRUST_META],
  initialStats: { trust: 35 },
}

const SONG_JIHYO: Character = {
  id: 'jihyo',
  name: '宋智孝',
  portrait: '/characters/jihyo.jpg',
  gender: 'female',
  age: 43,
  title: 'ACE',
  description: '冷静判断力的行动派',
  personality: '懵智外表下最冷静的判断力',
  speakingStyle: '安静简短，关键时刻才开口',
  secret: '最想证明不需要特别努力也能赢的从容',
  triggerPoints: ['信任度≥70解锁ACE认证', '运气判定幸运加成'],
  behaviorPatterns: '不善言辞但行动力极强',
  themeColor: '#ec4899',
  joinEpisode: 1,
  statMetas: [TRUST_META],
  initialStats: { trust: 25 },
}

const LEE_KWANGSOO: Character = {
  id: 'kwangsoo',
  name: '李光洙',
  portrait: '/characters/kwangsoo.jpg',
  gender: 'male',
  age: 39,
  title: '亚洲王子',
  description: '综艺最伟大的被害者',
  personality: '矛盾体——既想赢又害怕赢后的孤独',
  speakingStyle: '夸张语气，背叛时心虚，被抓时求饶',
  secret: '最大心愿是堂堂正正赢一次',
  triggerPoints: ['信任度≥50真正的义气', '连续被害3次触发逆袭'],
  behaviorPatterns: '用失败和倒霉制造名场面',
  themeColor: '#8b5cf6',
  joinEpisode: 1,
  statMetas: [TRUST_META],
  initialStats: { trust: 40 },
}

const JI_SUKJIN: Character = {
  id: 'sukjin',
  name: '池石镇',
  portrait: '/characters/sukjin.jpg',
  gender: 'male',
  age: 58,
  title: '大哥',
  description: '不服老的综艺前辈',
  personality: '固执的不服老与偶尔的智慧闪光',
  speakingStyle: '故作深沉但常暴露，回忆杀模式',
  secret: '对RM的热爱比任何人都深',
  triggerPoints: ['信任度≥50弱弱联合', '第1期结盟开启特殊路线'],
  behaviorPatterns: '体力垫底但永不放弃',
  themeColor: '#6366f1',
  joinEpisode: 1,
  statMetas: [TRUST_META],
  initialStats: { trust: 35 },
}

const JEON_SOMIN: Character = {
  id: 'somin',
  name: '全昭旻',
  portrait: '/characters/somin.jpg',
  gender: 'female',
  age: 37,
  title: '综艺小魔女',
  description: '最不可预测的综艺变量',
  personality: '极度外向、综艺感爆棚的直觉型',
  speakingStyle: '夸张情绪表达，突然正经有反差',
  secret: '最想要的是被认真对待',
  triggerPoints: ['综艺感≥60触发综艺搭档', '识破假吵架获额外积分'],
  behaviorPatterns: '善于制造戏剧性场面',
  themeColor: '#f43f5e',
  joinEpisode: 1,
  statMetas: [TRUST_META],
  initialStats: { trust: 30 },
}

const YANG_SECHAN: Character = {
  id: 'sechan',
  name: '梁世灿',
  portrait: '/characters/sechan.jpg',
  gender: 'male',
  age: 37,
  title: '综艺陀螺',
  description: '最努力的综艺能量体',
  personality: '用十倍努力证明自己属于这里',
  speakingStyle: '快速碎碎念，善于模仿变声',
  secret: '担心自己不够格，最大动力是不辜负大家',
  triggerPoints: ['综艺感≥50综艺配角加成', '与全昭旻双≥50新人组联盟'],
  behaviorPatterns: '最好的配角，能让搭档表现更出色',
  themeColor: '#14b8a6',
  joinEpisode: 1,
  statMetas: [TRUST_META],
  initialStats: { trust: 30 },
}

export function buildCharacters(): Record<string, Character> {
  return {
    jaesuk: YOO_JAESUK,
    jongkook: KIM_JONGKOOK,
    haha: HAHA_CHAR,
    jihyo: SONG_JIHYO,
    kwangsoo: LEE_KWANGSOO,
    sukjin: JI_SUKJIN,
    somin: JEON_SOMIN,
    sechan: YANG_SECHAN,
  }
}

// ── 全局属性 StatMeta ──

export const GLOBAL_STAT_METAS: StatMeta[] = [
  { key: 'stamina', label: '体力', color: '#ef4444', icon: '💪', category: 'skill' },
  { key: 'iq', label: '智商', color: '#3b82f6', icon: '🧠', category: 'skill' },
  { key: 'variety', label: '综艺感', color: '#f59e0b', icon: '🎭', category: 'skill' },
  { key: 'score', label: '积分', color: '#FFB800', icon: '⭐', category: 'status' },
]

// ── 场景 ──

export const SCENES: Record<string, Scene> = {
  studio: {
    id: 'studio',
    name: 'SBS演播厅',
    icon: '🎬',
    description: '室内录制主场地，各种游戏和推理任务的发生地',
    background: '/scenes/studio.jpg',
    atmosphere: '专业灯光下的综艺正式感',
    tags: ['室内', '推理', '游戏'],
  },
  hanriver: {
    id: 'hanriver',
    name: '汉江公园',
    icon: '🏞️',
    description: '户外追逐战经典场地，开阔草坪和河边跑道',
    background: '/scenes/hanriver.jpg',
    atmosphere: '自由开放的田野奔跑感',
    tags: ['户外', '追逐', '体力'],
  },
  amusement: {
    id: 'amusement',
    name: '游乐场',
    icon: '🎡',
    description: '大型游乐园特辑场地，过山车和惊险挑战',
    background: '/scenes/amusement.jpg',
    atmosphere: '童心与冒险的交汇',
    tags: ['户外', '刺激', '任务'],
  },
  market: {
    id: 'market',
    name: '传统市场',
    icon: '🏪',
    description: '美食任务和隐藏线索搜集的热闹场所',
    background: '/scenes/market.jpg',
    atmosphere: '最接地气的综艺现场',
    tags: ['户外', '美食', '寻宝'],
  },
  gymnasium: {
    id: 'gymnasium',
    name: '学校体育馆',
    icon: '🏋️',
    description: '体力对决和撕名牌大战的主战场',
    background: '/scenes/gymnasium.jpg',
    atmosphere: '纯粹的竞技氛围',
    tags: ['室内', '体力', '对决'],
  },
  factory: {
    id: 'factory',
    name: '废弃工厂',
    icon: '🏚️',
    description: '间谍战和推理游戏的神秘场地',
    background: '/scenes/factory.jpg',
    atmosphere: '悬疑和紧张的极致',
    tags: ['室内', '推理', '间谍'],
    unlockCondition: { event: 'episode5_spy' },
  },
}

// ── 道具 ──

export const ITEMS: Record<string, GameItem> = {
  runningball: {
    id: 'runningball',
    name: 'Running Ball',
    icon: '🏆',
    type: 'reward',
    description: '里程碑奖励，可兑换终极优势',
  },
  betrayal: {
    id: 'betrayal',
    name: '背叛券',
    icon: '🗡️',
    type: 'strategy',
    description: '关键时刻背叛联盟，获得双倍积分',
  },
  luck: {
    id: 'luck',
    name: '幸运符',
    icon: '🍀',
    type: 'special',
    description: '逆转一次不利抽签结果',
  },
  armor: {
    id: 'armor',
    name: '名牌护甲',
    icon: '🛡️',
    type: 'special',
    description: '撕名牌大战免撕一次',
  },
  spycomm: {
    id: 'spycomm',
    name: '间谍通讯器',
    icon: '📡',
    type: 'strategy',
    description: '间谍战中获得额外线索',
  },
  revive: {
    id: 'revive',
    name: '复活券',
    icon: '🔥',
    type: 'special',
    description: '被淘汰后获得复活机会',
  },
  stamina_pack: {
    id: 'stamina_pack',
    name: '体力补给包',
    icon: '💊',
    type: 'boost',
    description: '体力值+15',
  },
  wisdom_scroll: {
    id: 'wisdom_scroll',
    name: '智慧卷轴',
    icon: '📜',
    type: 'boost',
    description: '智商值+10，持续一期',
  },
}

// ── 章节 ──

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    name: '初来乍到',
    dayRange: [1, 3],
    description: '融入团队，建立初步人际关系',
    objectives: ['完成新人试炼', '建立第一个联盟', '在团队中找到定位'],
    atmosphere: '充满期待和紧张的新人期',
  },
  {
    id: 2,
    name: '联盟与裂变',
    dayRange: [4, 9],
    description: '在阵营分化中存活，积累足够积分',
    objectives: ['在阵营对立中存活', '参与间谍战', '通过中期评估'],
    atmosphere: '背叛与联盟交错的高潮期',
  },
  {
    id: 3,
    name: '最终之战',
    dayRange: [10, 15],
    description: '争夺最终排名，达成目标结局',
    objectives: ['组建最终联盟', '撕名牌大战生存', '传奇之战夺冠'],
    atmosphere: '紧张刺激的决战期',
  },
]

// ── 强制事件 ──

export const FORCED_EVENTS: ForcedEvent[] = [
  {
    id: 'ep1_initiation',
    name: '新人洗礼',
    triggerDay: 1,
    triggerPeriod: 0,
    description: '老成员们对新人的欢迎仪式，金钟国的握力测试和刘在石的综艺考核',
  },
  {
    id: 'ep2_conspiracy',
    name: '刘在石的密谋',
    triggerDay: 2,
    triggerPeriod: 1,
    description: '刘在石私下找你提议合作淘汰金钟国',
  },
  {
    id: 'ep5_spy',
    name: '间谍战开始',
    triggerDay: 5,
    triggerPeriod: 0,
    description: '废弃工厂解锁，间谍战正式开始',
  },
  {
    id: 'ep9_evaluation',
    name: '中期评估',
    triggerDay: 9,
    triggerPeriod: 2,
    description: '积分排名公开，末位三名进入保级赛',
  },
  {
    id: 'ep12_nametag',
    name: '撕名牌大战',
    triggerDay: 12,
    triggerPeriod: 1,
    description: '经典撕名牌追逐战，体力值是核心',
  },
  {
    id: 'ep15_final',
    name: '传奇之战',
    triggerDay: 15,
    triggerPeriod: 0,
    description: '三阶段最终对决：体力赛→智力赛→综艺对决',
  },
]

// ── 结局 ──

export const ENDINGS: Ending[] = [
  {
    id: 'be-eliminated',
    name: '遗憾离场',
    type: 'BE',
    description: '体力耗尽、积分垫底，在第9期被淘汰。你默默收拾行李，但成员们的拥抱让你知道——你已经是家人了。',
    condition: '体力<20且积分末位',
  },
  {
    id: 'be-enemy',
    name: '公敌末路',
    type: 'BE',
    description: '所有成员的信任已经降到冰点。刘在石叹了口气："游戏是游戏，但你连基本的信任都弄丢了。"',
    condition: '所有成员信任度≤-50',
  },
  {
    id: 'te-betrayer',
    name: '背叛者之王',
    type: 'TE',
    description: '你用无数次精确的背叛登上了积分榜前三。金色名牌上刻着"背叛者之王"——孤独，但强大。',
    condition: '成功背叛≥3次+积分前三+无铁盟',
  },
  {
    id: 'te-brain',
    name: '智者的胜利',
    type: 'TE',
    description: '最终战的智力赛中，你用完美的推理击败了所有人。刘在石鼓掌："Running Man大脑，实至名归！"',
    condition: '智商≥85+最终战智力赛第一',
  },
  {
    id: 'he-strongest',
    name: '最强者',
    type: 'HE',
    description: '积分第一、实力顶尖、还有值得信赖的伙伴。金钟国亲手为你戴上金色名牌："你配得上这个称号。"',
    condition: '积分第一+体力/智商≥75+至少一个铁盟',
  },
  {
    id: 'he-ace',
    name: 'ACE结局',
    type: 'HE',
    description: '你用综艺感征服了所有人。宋智孝微笑着把王冠放在你头上："综艺ACE，就是你。"',
    condition: '综艺感≥80+平均信任度≥60+进入决赛',
  },
  {
    id: 'se-underdog',
    name: '逆袭传奇',
    type: 'SE',
    description: '谁也没想到初始最弱的你能走到最后。李光洙哭了："终于......有人比我更能证明奇迹了。"',
    condition: '初始属性最低+最终进入前三',
  },
  {
    id: 'ne-comedian',
    name: '笑到最后',
    type: 'NE',
    description: '积分垫底但综艺感爆表。观众投票你为"特别奖"。HAHA搂着你："兄弟，这才是Running Man的意义啊。"',
    condition: '综艺感最高但积分末位',
  },
]

// ── 游戏信息 + 快捷操作 ──

export const STORY_INFO = {
  title: 'Running Man',
  subtitle: '传奇赛季',
  description: '风靡亚洲的真人竞技综艺，15期终极生存挑战！',
  objective: '成为传奇赛季最强者',
  setting: 'SBS综艺录制现场',
}

export const QUICK_ACTIONS: string[] = [
  '⚔️ 挑战对决',
  '🤝 结盟合作',
  '🎭 搞笑整活',
  '👁️ 暗中观察',
]

// ── 角色类型选择 ──

export interface RoleType {
  id: string
  name: string
  icon: string
  description: string
  initialStats: { stamina: number; iq: number; variety: number; score: number }
}

export const ROLE_TYPES: RoleType[] = [
  {
    id: 'power',
    name: '能力者',
    icon: '💪',
    description: '体力初始值高，追逐战和体力游戏有优势',
    initialStats: { stamina: 75, iq: 45, variety: 40, score: 0 },
  },
  {
    id: 'brain',
    name: '脑力者',
    icon: '🧠',
    description: '智商初始值高，推理和解谜游戏有优势',
    initialStats: { stamina: 45, iq: 75, variety: 40, score: 0 },
  },
  {
    id: 'entertainer',
    name: '综艺人',
    icon: '🎭',
    description: '综艺感初始值高，制造笑点和获得同情有优势',
    initialStats: { stamina: 45, iq: 40, variety: 75, score: 0 },
  },
  {
    id: 'social',
    name: '社交达人',
    icon: '🤝',
    description: '各项均衡，初始信任度较高',
    initialStats: { stamina: 55, iq: 55, variety: 55, score: 0 },
  },
]

// ── 工具函数 ──

export function getStatLevel(value: number) {
  if (value >= 80) return { level: 4, name: '顶级', color: '#FFB800' }
  if (value >= 60) return { level: 3, name: '优秀', color: '#22c55e' }
  if (value >= 30) return { level: 2, name: '普通', color: '#3b82f6' }
  return { level: 1, name: '危险', color: '#dc2626' }
}

export function getAvailableCharacters(
  episode: number,
  characters: Record<string, Character>
): Record<string, Character> {
  return Object.fromEntries(
    Object.entries(characters).filter(([, char]) => char.joinEpisode <= episode)
  )
}

export function getCurrentChapter(episode: number): Chapter {
  return CHAPTERS.find((ch) => episode >= ch.dayRange[0] && episode <= ch.dayRange[1])
    ?? CHAPTERS[0]
}

export function getDayEvents(
  episode: number,
  triggeredEvents: string[]
): ForcedEvent[] {
  return FORCED_EVENTS.filter(
    (e) => e.triggerDay === episode && !triggeredEvents.includes(e.id)
  )
}

export function getTrustLevel(trust: number) {
  if (trust >= 80) return { label: '铁盟', color: '#FFB800', icon: '🔒' }
  if (trust >= 50) return { label: '信赖', color: '#22c55e', icon: '💚' }
  if (trust >= 20) return { label: '友善', color: '#3b82f6', icon: '🙂' }
  if (trust >= -20) return { label: '中立', color: '#94a3b8', icon: '😐' }
  if (trust >= -50) return { label: '警戒', color: '#f59e0b', icon: '⚠️' }
  return { label: '公敌', color: '#dc2626', icon: '💀' }
}
