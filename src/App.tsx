import { useEffect, useState } from 'react'
import type { LangPref } from './i18n'
import { STRINGS, detectLang } from './i18n'
import ToneCard from './ToneCard'
import type { Tone } from './types'
import { OCTAVE_DEFAULT, WAVES, snapOctaves } from './types'
import { useToneEngine } from './useToneEngine'

const STORAGE_KEY = 'tinnitus-settings'
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
  lang: LangPref
}

const LANG_PREFS: readonly LangPref[] = ['auto', 'zh', 'en']

const isValidTone = (t: unknown): t is Tone => {
  if (typeof t !== 'object' || t === null) return false
  const tone = t as Partial<Tone>
  return (
    Number.isFinite(tone.freq) &&
    Number.isFinite(tone.volume) &&
    Number.isFinite(tone.pan) &&
    Number.isFinite(tone.octaves) &&
    (tone.octaves as number) > 0 &&
    (tone.mode === 'tone' || tone.mode === 'noise') &&
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
        octaves: snapOctaves(t.octaves),
        playing: false,
      })),
      lang: LANG_PREFS.includes(data.lang as LangPref) ? (data.lang as LangPref) : 'auto',
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
  const [detected] = useState(detectLang)
  const [tones, setTones] = useState<Tone[]>(() => saved?.tones ?? defaultTones())
  const [langPref, setLangPref] = useState<LangPref>(() => saved?.lang ?? 'auto')

  const lang = langPref === 'auto' ? detected : langPref
  const t = STRINGS[lang]

  useToneEngine(tones)

  useEffect(() => {
    saveState({ tones, lang: langPref })
  }, [tones, langPref])

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    document.title = t.title
  }, [lang, t.title])

  const anyPlaying = tones.some((tn) => tn.playing)

  const reset = () => {
    clearState()
    setTones(defaultTones())
    setLangPref('auto')
  }

  const update = (id: number, patch: Partial<Tone>) =>
    setTones((ts) => ts.map((tn) => (tn.id === id ? { ...tn, ...patch } : tn)))

  const remove = (id: number) => setTones((ts) => ts.filter((tn) => tn.id !== id))

  const addTone = () =>
    setTones((ts) => [...ts, createTone(ts.length > 0 ? ts[ts.length - 1].freq : 4000)])

  const toggleAll = () => setTones((ts) => ts.map((tn) => ({ ...tn, playing: !anyPlaying })))

  const langOptions = [
    { value: 'auto', label: t.auto },
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' },
  ] as const

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-zinc-600">{t.langLabel}</span>
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {langOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setLangPref(o.value)}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  langPref === o.value
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <header className="mt-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t.title}</h1>
        </header>

        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200/90">
          {t.safety}
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
              {anyPlaying ? t.stopAll : t.playAll}
            </button>
            <button
              type="button"
              onClick={addTone}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
            >
              {t.addTone}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
            >
              {t.reset}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {tones.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-800 py-10 text-center text-sm text-zinc-500">
              {t.empty}
            </div>
          )}
          {tones.map((tone) => (
            <ToneCard
              key={tone.id}
              tone={tone}
              t={t}
              onChange={(patch) => update(tone.id, patch)}
              onRemove={() => remove(tone.id)}
            />
          ))}
        </div>

        <footer className="mt-10 text-center text-xs leading-relaxed text-zinc-600">
          {t.footerAdvice}
          <br />
          {t.footerDisclaimer}
        </footer>
      </main>
    </div>
  )
}
