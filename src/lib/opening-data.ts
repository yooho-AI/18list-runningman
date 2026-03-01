/**
 * [INPUT]: None
 * [OUTPUT]: COVER + PROLOGUE 配置数据
 * [POS]: 开场序列种子文件，封面 + 序幕文案配置
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

// ── 封面配置 ──

export const COVER = {
  video: '/video/landing.mp4',
  poster: '/video/landing-poster.jpg',
  title: 'Running Man',
  subtitle: '传 奇 赛 季',
  slogan: '8位传奇成员 · 15期终极挑战 · 谁是最强者',
}

// ── 序幕配置 ──

export const PROLOGUE = {
  // Phase 1: 聚光灯 + Logo
  spotlight: {
    icon: '🏃',
    description: '风靡亚洲的真人竞技综艺，15期终极生存挑战！\n与刘在石、金钟国等传奇成员一起奔跑吧！',
  },

  // Phase 2: 成员蒙太奇闪切
  montage: [
    { name: '刘在石', title: '国民MC', portrait: '/characters/jaesuk.jpg' },
    { name: '金钟国', title: '能力者', portrait: '/characters/jongkook.jpg' },
    { name: 'HAHA', title: '氛围担当', portrait: '/characters/haha.jpg' },
    { name: '宋智孝', title: 'ACE', portrait: '/characters/jihyo.jpg' },
    { name: '李光洙', title: '亚洲王子', portrait: '/characters/kwangsoo.jpg' },
    { name: '池石镇', title: '大哥', portrait: '/characters/sukjin.jpg' },
    { name: '全昭旻', title: '综艺小魔女', portrait: '/characters/somin.jpg' },
    { name: '梁世灿', title: '综艺陀螺', portrait: '/characters/sechan.jpg' },
  ],

  // Phase 3: 角色选择 + 名字输入
  roles: [
    {
      id: 'power',
      icon: '💪',
      name: '能力者',
      desc: '体力初始值高，追逐战和体力游戏有优势',
      stats: { stamina: 75, iq: 45, variety: 40 },
    },
    {
      id: 'brain',
      icon: '🧠',
      name: '脑力者',
      desc: '智商初始值高，推理和解谜游戏有优势',
      stats: { stamina: 45, iq: 75, variety: 40 },
    },
    {
      id: 'entertainer',
      icon: '🎭',
      name: '综艺人',
      desc: '综艺感初始值高，制造笑点有优势',
      stats: { stamina: 45, iq: 40, variety: 75 },
    },
    {
      id: 'social',
      icon: '🤝',
      name: '社交达人',
      desc: '各项均衡，初始信任度较高',
      stats: { stamina: 55, iq: 55, variety: 55 },
    },
  ],

  nameInput: {
    label: '参赛昵称',
    placeholder: '输入你的名字',
    maxLength: 10,
    ctaText: '开始录制 ▸',
  },
}
