export const WAVES = ['sine', 'square', 'sawtooth', 'triangle'] as const

export type WaveType = (typeof WAVES)[number]

export const WAVE_LABELS: Record<WaveType, string> = {
  sine: '正弦',
  square: '方波',
  sawtooth: '锯齿',
  triangle: '三角',
}

export interface Tone {
  id: number
  freq: number
  volume: number
  wave: WaveType
  playing: boolean
}
