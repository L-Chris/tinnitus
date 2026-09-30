export const WAVES = ['sine', 'square', 'sawtooth', 'triangle'] as const

export type WaveType = (typeof WAVES)[number]

export type ToneMode = 'tone' | 'noise'

export const MODE_VALUES = ['tone', 'noise'] as const

export const PAN_VALUES = [-1, 0, 1] as const

export const OCTAVE_OPTIONS = [
  { value: 1 / 24, label: '1/24' },
  { value: 1 / 12, label: '1/12' },
  { value: 1 / 6, label: '1/6' },
  { value: 1 / 3, label: '1/3' },
  { value: 1 / 2, label: '1/2' },
  { value: 1, label: '1' },
] as const

export const OCTAVE_DEFAULT = 1 / 3
export const OCTAVE_MIN = 0.01
export const OCTAVE_MAX = 4

export const octaveLabel = (v: number) =>
  OCTAVE_OPTIONS.find((o) => o.value === v)?.label ?? String(v)

export const snapOctaves = (n: number) => {
  const preset = OCTAVE_OPTIONS.find((o) => Math.abs(o.value - n) < 0.0002)
  if (preset !== undefined) return preset.value
  return Math.min(OCTAVE_MAX, Math.max(OCTAVE_MIN, Math.round(n * 10000) / 10000))
}

export interface Tone {
  id: number
  freq: number
  volume: number
  wave: WaveType
  mode: ToneMode
  octaves: number
  pan: number
  playing: boolean
}
