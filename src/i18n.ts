import type { ToneMode, WaveType } from './types'

export type Lang = 'zh' | 'en'
export type LangPref = 'auto' | Lang

export const detectLang = (): Lang => {
  const pref = (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase()
  return pref.startsWith('zh') ? 'zh' : 'en'
}

export interface Strings {
  title: string
  langLabel: string
  auto: string
  safety: string
  playAll: string
  stopAll: string
  addTone: string
  reset: string
  empty: string
  footerAdvice: string
  footerDisclaimer: string
  play: string
  stop: string
  removeTone: string
  freq: string
  freqInput: string
  volume: string
  volumeWord: string
  bandwidth: string
  bandwidthInput: string
  noiseInfo: string
  leftOnly: string
  rightOnly: string
  waves: Record<WaveType, string>
  modes: Record<ToneMode, string>
  pans: Record<number, string>
}

export const STRINGS: Record<Lang, Strings> = {
  zh: {
    title: '耳鸣频率测试',
    langLabel: '语言',
    auto: '自动',
    safety:
      '安全提示：请以较小音量开始测试，避免长时间大音量播放，以免对听力造成损伤。如感不适请立即停止。',
    playAll: '全部播放',
    stopAll: '全部停止',
    addTone: '+ 添加音调',
    reset: '重置',
    empty: '暂无音调，点击「+ 添加音调」开始测试',
    footerAdvice: '测试建议：佩戴耳机，在安静环境中进行；先调低音量，再逐步上调至与耳鸣响度相当。',
    footerDisclaimer: '本工具仅供辅助参考，不能替代专业医疗诊断。',
    play: '播放',
    stop: '停止',
    removeTone: '删除音调',
    freq: '频率',
    freqInput: '频率数值输入',
    volume: '音量',
    volumeWord: '音量',
    bandwidth: '带宽',
    bandwidthInput: '自定义带宽（octave）',
    noiseInfo: '窄带噪声',
    leftOnly: '仅左耳',
    rightOnly: '仅右耳',
    waves: { sine: '正弦', square: '方波', sawtooth: '锯齿', triangle: '三角' },
    modes: { tone: '纯音', noise: '噪声' },
    pans: { [-1]: '左耳', [0]: '双耳', [1]: '右耳' },
  },
  en: {
    title: 'Tinnitus Frequency Tester',
    langLabel: 'Language',
    auto: 'Auto',
    safety:
      'Safety: start at a low volume and avoid prolonged loud playback to protect your hearing. Stop immediately if you feel discomfort.',
    playAll: 'Play All',
    stopAll: 'Stop All',
    addTone: '+ Add Tone',
    reset: 'Reset',
    empty: 'No tones yet — click "+ Add Tone" to start',
    footerAdvice:
      'Tips: use headphones in a quiet place; start at a low volume, then raise it until the tone matches your tinnitus loudness.',
    footerDisclaimer: 'For reference only — not a substitute for professional medical advice.',
    play: 'Play',
    stop: 'Stop',
    removeTone: 'Remove tone',
    freq: 'Frequency',
    freqInput: 'Frequency input',
    volume: 'Volume',
    volumeWord: 'Vol',
    bandwidth: 'Bandwidth',
    bandwidthInput: 'Custom bandwidth (octaves)',
    noiseInfo: 'Narrowband noise',
    leftOnly: 'Left only',
    rightOnly: 'Right only',
    waves: { sine: 'Sine', square: 'Square', sawtooth: 'Saw', triangle: 'Tri' },
    modes: { tone: 'Tone', noise: 'Noise' },
    pans: { [-1]: 'Left', [0]: 'Both', [1]: 'Right' },
  },
}
