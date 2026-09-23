import { useEffect, useRef } from 'react'
import { makeNoiseBuffer, noiseCompensation, octaveQ } from './audio'
import type { Tone } from './types'

interface ToneVoice {
  mode: 'tone'
  osc: OscillatorNode
  gain: GainNode
  panner: StereoPannerNode
}

interface NoiseVoice {
  mode: 'noise'
  noise: AudioBufferSourceNode
  band1: BiquadFilterNode
  band2: BiquadFilterNode
  level: GainNode
  gain: GainNode
  panner: StereoPannerNode
}

type Voice = ToneVoice | NoiseVoice

interface Engine {
  ctx: AudioContext | null
  master: GainNode | null
  noiseBuffer: AudioBuffer | null
  voices: Map<number, Voice>
}

const releaseVoice = (voice: Voice, ctx: AudioContext) => {
  voice.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.02)
  const src = voice.mode === 'tone' ? voice.osc : voice.noise
  src.stop(ctx.currentTime + 0.2)
}

const createVoice = (
  ctx: AudioContext,
  master: GainNode,
  noiseBuffer: AudioBuffer,
  tone: Tone,
): Voice => {
  const gain = ctx.createGain()
  const panner = ctx.createStereoPanner()
  panner.pan.value = tone.pan
  gain.connect(panner)
  panner.connect(master)
  const t = ctx.currentTime
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(tone.volume, t + 0.03)

  if (tone.mode === 'noise') {
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true
    const band1 = ctx.createBiquadFilter()
    const band2 = ctx.createBiquadFilter()
    const q = octaveQ(tone.octaves)
    band1.type = 'bandpass'
    band1.frequency.value = tone.freq
    band1.Q.value = q
    band2.type = 'bandpass'
    band2.frequency.value = tone.freq
    band2.Q.value = q
    const level = ctx.createGain()
    level.gain.value = noiseCompensation(ctx.sampleRate, tone.freq, tone.octaves)
    noise.connect(band1)
    band1.connect(band2)
    band2.connect(level)
    level.connect(gain)
    noise.onended = () => {
      noise.disconnect()
      band1.disconnect()
      band2.disconnect()
      level.disconnect()
      gain.disconnect()
      panner.disconnect()
    }
    noise.start(t)
    return { mode: 'noise', noise, band1, band2, level, gain, panner }
  }

  const osc = ctx.createOscillator()
  osc.type = tone.wave
  osc.frequency.value = tone.freq
  osc.connect(gain)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
    panner.disconnect()
  }
  osc.start(t)
  return { mode: 'tone', osc, gain, panner }
}

export function useToneEngine(tones: Tone[], masterVolume: number) {
  const engineRef = useRef<Engine>({
    ctx: null,
    master: null,
    noiseBuffer: null,
    voices: new Map(),
  })

  useEffect(() => {
    const engine = engineRef.current
    const active = tones.filter((t) => t.playing)
    if (active.length === 0 && engine.ctx === null) return

    const ctx = engine.ctx ?? new AudioContext()
    engine.ctx = ctx
    if (ctx.state === 'suspended') void ctx.resume()

    let master = engine.master
    if (master === null) {
      const limiter = ctx.createDynamicsCompressor()
      limiter.threshold.value = -1
      limiter.knee.value = 0
      limiter.ratio.value = 20
      limiter.attack.value = 0.003
      limiter.release.value = 0.1
      limiter.connect(ctx.destination)

      const created = ctx.createGain()
      created.gain.value = masterVolume
      created.connect(limiter)
      engine.master = created
      master = created
    }
    master.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.02)

    let noiseBuffer = engine.noiseBuffer
    if (noiseBuffer === null) {
      noiseBuffer = makeNoiseBuffer(ctx)
      engine.noiseBuffer = noiseBuffer
    }

    const activeIds = new Set(active.map((t) => t.id))
    for (const [id, voice] of engine.voices) {
      if (!activeIds.has(id)) {
        releaseVoice(voice, ctx)
        engine.voices.delete(id)
      }
    }

    for (const tone of active) {
      const existing = engine.voices.get(tone.id)
      if (existing === undefined) {
        engine.voices.set(tone.id, createVoice(ctx, master, noiseBuffer, tone))
        continue
      }
      if (existing.mode !== tone.mode) {
        releaseVoice(existing, ctx)
        engine.voices.set(tone.id, createVoice(ctx, master, noiseBuffer, tone))
        continue
      }
      existing.gain.gain.setTargetAtTime(tone.volume, ctx.currentTime, 0.02)
      existing.panner.pan.setTargetAtTime(tone.pan, ctx.currentTime, 0.02)
      if (existing.mode === 'tone') {
        existing.osc.type = tone.wave
        existing.osc.frequency.setTargetAtTime(tone.freq, ctx.currentTime, 0.015)
      } else {
        const q = octaveQ(tone.octaves)
        const k = noiseCompensation(ctx.sampleRate, tone.freq, tone.octaves)
        existing.band1.frequency.setTargetAtTime(tone.freq, ctx.currentTime, 0.015)
        existing.band2.frequency.setTargetAtTime(tone.freq, ctx.currentTime, 0.015)
        existing.band1.Q.setTargetAtTime(q, ctx.currentTime, 0.02)
        existing.band2.Q.setTargetAtTime(q, ctx.currentTime, 0.02)
        existing.level.gain.setTargetAtTime(k, ctx.currentTime, 0.02)
      }
    }
  }, [tones, masterVolume])

  useEffect(() => {
    const engine = engineRef.current
    return () => {
      for (const voice of engine.voices.values()) {
        const src = voice.mode === 'tone' ? voice.osc : voice.noise
        src.onended = null
        src.stop()
        src.disconnect()
        if (voice.mode === 'noise') {
          voice.band1.disconnect()
          voice.band2.disconnect()
          voice.level.disconnect()
        }
        voice.gain.disconnect()
        voice.panner.disconnect()
      }
      engine.voices.clear()
      engine.master?.disconnect()
      engine.master = null
      engine.noiseBuffer = null
      void engine.ctx?.close()
      engine.ctx = null
    }
  }, [])
}
