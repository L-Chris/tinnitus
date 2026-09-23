import { useState } from 'react'
import { bandWidthHz } from './audio'
import type { Tone } from './types'
import {
  MODE_OPTIONS,
  OCTAVE_MAX,
  OCTAVE_MIN,
  OCTAVE_OPTIONS,
  PAN_OPTIONS,
  WAVES,
  WAVE_LABELS,
  octaveLabel,
  snapOctaves,
} from './types'

const F_MIN = 20
const F_MAX = 20000
const LOG_RANGE = Math.log(F_MAX / F_MIN)

const clampFreq = (f: number) => Math.min(F_MAX, Math.max(F_MIN, Math.round(f)))
const snapFreq10 = (f: number) => clampFreq(Math.round(f / 10) * 10)
const toSlider = (f: number) => Math.round((1000 * Math.log(f / F_MIN)) / LOG_RANGE)
const fromSlider = (v: number) => F_MIN * Math.exp((LOG_RANGE * v) / 1000)
const fmtOct = (v: number) => String(Math.round(v * 10000) / 10000)
const formatHz = (hz: number) =>
  hz >= 1000 ? `${(hz / 1000).toFixed(1)} kHz` : `${Math.round(hz)} Hz`

interface ToneCardProps {
  tone: Tone
  onChange: (patch: Partial<Tone>) => void
  onRemove: () => void
}

export default function ToneCard({ tone, onChange, onRemove }: ToneCardProps) {
  const [freqText, setFreqText] = useState(String(tone.freq))
  const [lastFreq, setLastFreq] = useState(tone.freq)
  const [octText, setOctText] = useState(fmtOct(tone.octaves))
  const [lastOct, setLastOct] = useState(tone.octaves)

  if (tone.freq !== lastFreq) {
    setLastFreq(tone.freq)
    setFreqText(String(tone.freq))
  }

  if (tone.octaves !== lastOct) {
    setLastOct(tone.octaves)
    setOctText(fmtOct(tone.octaves))
  }

  const commitFreq = () => {
    const n = Number(freqText)
    if (Number.isFinite(n) && n > 0) {
      const f = clampFreq(n)
      onChange({ freq: f })
      setFreqText(String(f))
    } else {
      setFreqText(String(tone.freq))
    }
  }

  const commitOctaves = () => {
    const n = Number(octText)
    if (Number.isFinite(n) && n > 0) {
      const v = snapOctaves(n)
      onChange({ octaves: v })
      setOctText(fmtOct(v))
    } else {
      setOctText(fmtOct(tone.octaves))
    }
  }

  const nudge = (delta: number) => onChange({ freq: clampFreq(tone.freq + delta) })
  const volumePct = Math.round(tone.volume * 100)

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        tone.playing ? 'border-cyan-500/40 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-900/60'
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange({ playing: !tone.playing })}
          aria-label={tone.playing ? '停止' : '播放'}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
            tone.playing
              ? 'bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
              : 'bg-zinc-800 text-cyan-300 hover:bg-zinc-700'
          }`}
        >
          {tone.playing ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <rect x="6" y="6" width="12" height="12" rx="1.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current">
              <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-2xl font-semibold tabular-nums text-zinc-50">
            {tone.freq}
            <span className="ml-1 text-base font-normal text-zinc-400">Hz</span>
          </div>
          <div className="text-xs text-zinc-500">
            {tone.mode === 'noise'
              ? `窄带噪声 ${octaveLabel(tone.octaves)} oct`
              : `${WAVE_LABELS[tone.wave]}波`}{' '}
            · 音量 {volumePct}%
            {tone.pan !== 0 && ` · 仅${tone.pan < 0 ? '左' : '右'}耳`}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label="删除音调"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={1000}
          value={toSlider(tone.freq)}
          onChange={(e) => onChange({ freq: snapFreq10(fromSlider(Number(e.target.value))) })}
          className="w-full"
          aria-label="频率"
        />
        <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
          <span>20 Hz</span>
          <span>20 kHz</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {[-10, -1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => nudge(d)}
              className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs tabular-nums text-zinc-300 hover:bg-zinc-700"
            >
              {d}
            </button>
          ))}
          <input
            type="number"
            min={F_MIN}
            max={F_MAX}
            value={freqText}
            onChange={(e) => setFreqText(e.target.value)}
            onBlur={commitFreq}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitFreq()
            }}
            className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-center text-sm tabular-nums text-zinc-100 focus:border-cyan-500 focus:outline-none"
            aria-label="频率数值输入"
          />
          <span className="text-xs text-zinc-500">Hz</span>
          {[1, 10].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => nudge(d)}
              className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs tabular-nums text-zinc-300 hover:bg-zinc-700"
            >
              +{d}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange({ mode: m.value })}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  tone.mode === m.value
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {PAN_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange({ pan: p.value })}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  tone.pan === p.value
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {tone.mode === 'tone' && (
            <div className="flex overflow-hidden rounded-lg border border-zinc-700">
              {WAVES.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onChange({ wave: w })}
                  className={`px-2.5 py-1 text-xs transition-colors ${
                    tone.wave === w
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {WAVE_LABELS[w]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {tone.mode === 'noise' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="shrink-0 text-xs text-zinc-500">带宽</span>
          <div className="flex overflow-hidden rounded-lg border border-zinc-700">
            {OCTAVE_OPTIONS.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => onChange({ octaves: o.value })}
                className={`px-2 py-1 text-xs transition-colors ${
                  tone.octaves === o.value
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={OCTAVE_MIN}
              max={OCTAVE_MAX}
              step={0.05}
              value={octText}
              onChange={(e) => setOctText(e.target.value)}
              onBlur={commitOctaves}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitOctaves()
              }}
              className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-center text-sm tabular-nums text-zinc-100 focus:border-cyan-500 focus:outline-none"
              aria-label="自定义带宽（octave）"
            />
            <span className="shrink-0 text-xs text-zinc-500">oct</span>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-zinc-400">
            ≈ {formatHz(bandWidthHz(tone.freq, tone.octaves))}
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current text-zinc-500">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
        <input
          type="range"
          min={0}
          max={100}
          value={volumePct}
          onChange={(e) => onChange({ volume: Number(e.target.value) / 100 })}
          className="flex-1"
          aria-label="音量"
        />
        <span className="w-10 text-right text-sm tabular-nums text-zinc-400">{volumePct}%</span>
      </div>
    </div>
  )
}
