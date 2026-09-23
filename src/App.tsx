import { useEffect, useState } from 'react'
import ToneCard from './ToneCard'
import type { Tone } from './types'
import { OCTAVE_DEFAULT, OCTAVE_MAX, OCTAVE_MIN, WAVES } from './types'
import { useToneEngine } from './useToneEngine'

const STORAGE_KEY = 'tinnitus-settings'
const MASTER_DEFAULT = 0.8
const DEFAULT_FREQS = [4000, 8000]

let nextId = 1
const createTone = (freq: number): Tone => ({
  id: nextId++,
  freq,
  volume: 0.3,
  wave: 'sine',
  mode: 'tone',
  octaves: OCTAVE_DEFAULT,
  pan: 0,
  playing: false,
})

const defaultTones = () => DEFAULT_FREQS.map((f) => createTone(f))

interface SavedState {
  tones: Tone[]
  master: number
}

const isValidTone = (t: unknown): t is Tone => {
  if (typeof t !== 'object' || t === null) return false
  const tone = t as Partial<Tone>
  return (
    Number.isFinite(tone.freq) &&
    Number.isFinite(tone.volume) &&
    Number.isFinite(tone.pan) &&
    typeof tone.wave === 'string' &&
    (WAVES as readonly string[]).includes(tone.wave)
  )
}

const loadState = (): SavedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const data = JSON.parse(raw) as Partial<SavedState>
    if (!Array.isArray(data.tones) || !data.tones.every(isValidTone)) return null
    return {
      tones: data.tones.map((t) => ({
        ...t,
        id: nextId++,
        freq: Math.min(20000, Math.max(20, Math.round(t.freq))),
        volume: Math.min(1, Math.max(0, t.volume)),
        pan: Math.min(1, Math.max(-1, t.pan)),
        mode: t.mode === 'noise' ? 'noise' : 'tone',
        octaves: Number.isFinite(t.octaves)
          ? Math.min(OCTAVE_MAX, Math.max(OCTAVE_MIN, Math.round(t.octaves * 10000) / 10000))
          : OCTAVE_DEFAULT,
        playing: false,
      })),
      master: Number.isFinite(data.master)
        ? Math.min(1, Math.max(0, data.master as number))
        : MASTER_DEFAULT,
    }
  } catch {
    return null
  }
}

const saveState = (state: SavedState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export default function App() {
  const [saved] = useState(loadState)
  const [tones, setTones] = useState<Tone[]>(() => saved?.tones ?? defaultTones())
  const [master, setMaster] = useState(() => saved?.master ?? MASTER_DEFAULT)

  useToneEngine(tones, master)

  useEffect(() => {
    saveState({ tones, master })
  }, [tones, master])

  const anyPlaying = tones.some((t) => t.playing)

  const reset = () => {
    clearState()
    setTones(defaultTones())
    setMaster(MASTER_DEFAULT)
  }

  const update = (id: number, patch: Partial<Tone>) =>
    setTones((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const remove = (id: number) => setTones((ts) => ts.filter((t) => t.id !== id))

  const addTone = () =>
    setTones((ts) => [...ts, createTone(ts.length > 0 ? ts[ts.length - 1].freq : 4000)])

  const toggleAll = () => setTones((ts) => ts.map((t) => ({ ...t, playing: !anyPlaying })))

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">耳鸣频率测试</h1>
        </header>

        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200/90">
          安全提示：请以较小音量开始测试，避免长时间大音量播放，以免对听力造成损伤。如感不适请立即停止。
        </div>

        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleAll}
              disabled={tones.length === 0}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                anyPlaying
                  ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400'
              }`}
            >
              {anyPlaying ? '全部停止' : '全部播放'}
            </button>
            <button
              type="button"
              onClick={addTone}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
            >
              + 添加音调
            </button>
            <div className="flex min-w-40 flex-1 items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current text-zinc-500">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(master * 100)}
                onChange={(e) => setMaster(Number(e.target.value) / 100)}
                className="flex-1"
                aria-label="主音量"
              />
              <span className="w-10 text-right text-sm tabular-nums text-zinc-400">
                {Math.round(master * 100)}%
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
            >
              重置
            </button>
          </div>
          <div className="mt-2 text-xs text-zinc-600">主音量（总输出）</div>
        </div>

        <div className="mt-4 space-y-4">
          {tones.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-800 py-10 text-center text-sm text-zinc-500">
              暂无音调，点击「+ 添加音调」开始测试
            </div>
          )}
          {tones.map((tone) => (
            <ToneCard
              key={tone.id}
              tone={tone}
              onChange={(patch) => update(tone.id, patch)}
              onRemove={() => remove(tone.id)}
            />
          ))}
        </div>

        <footer className="mt-10 text-center text-xs leading-relaxed text-zinc-600">
          测试建议：佩戴耳机，在安静环境中进行；先调低音量，再逐步上调至与耳鸣响度相当。
          <br />
          本工具仅供辅助参考，不能替代专业医疗诊断。
        </footer>
      </main>
    </div>
  )
}
