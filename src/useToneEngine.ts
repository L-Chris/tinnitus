import { useEffect, useRef } from 'react'
import type { Tone } from './types'

interface Voice {
  osc: OscillatorNode
  gain: GainNode
  panner: StereoPannerNode
}

interface Engine {
  ctx: AudioContext | null
  master: GainNode | null
  voices: Map<number, Voice>
}

export function useToneEngine(tones: Tone[], masterVolume: number) {
  const engineRef = useRef<Engine>({ ctx: null, master: null, voices: new Map() })

  useEffect(() => {
    const engine = engineRef.current
    const active = tones.filter((t) => t.playing)
    if (active.length === 0 && engine.ctx === null) return

    const ctx = engine.ctx ?? new AudioContext()
    engine.ctx = ctx
    if (ctx.state === 'suspended') void ctx.resume()

    if (engine.master === null) {
      const limiter = ctx.createDynamicsCompressor()
      limiter.threshold.value = -1
      limiter.knee.value = 0
      limiter.ratio.value = 20
      limiter.attack.value = 0.003
      limiter.release.value = 0.1
      limiter.connect(ctx.destination)

      const master = ctx.createGain()
      master.gain.value = masterVolume
      master.connect(limiter)
      engine.master = master
    }
    engine.master.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.02)

    const activeIds = new Set(active.map((t) => t.id))
    for (const [id, voice] of engine.voices) {
      if (!activeIds.has(id)) {
        voice.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.02)
        voice.osc.stop(ctx.currentTime + 0.2)
        engine.voices.delete(id)
      }
    }

    for (const tone of active) {
      const existing = engine.voices.get(tone.id)
      if (existing === undefined) {
        const osc = ctx.createOscillator()
        osc.type = tone.wave
        osc.frequency.value = tone.freq
        const gain = ctx.createGain()
        const panner = ctx.createStereoPanner()
        panner.pan.value = tone.pan
        osc.connect(gain)
        gain.connect(panner)
        panner.connect(engine.master)
        osc.onended = () => {
          osc.disconnect()
          gain.disconnect()
          panner.disconnect()
        }
        const t = ctx.currentTime
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(tone.volume, t + 0.03)
        osc.start(t)
        engine.voices.set(tone.id, { osc, gain, panner })
      } else {
        existing.osc.type = tone.wave
        existing.osc.frequency.setTargetAtTime(tone.freq, ctx.currentTime, 0.015)
        existing.gain.gain.setTargetAtTime(tone.volume, ctx.currentTime, 0.02)
        existing.panner.pan.setTargetAtTime(tone.pan, ctx.currentTime, 0.02)
      }
    }
  }, [tones, masterVolume])

  useEffect(() => {
    const engine = engineRef.current
    return () => {
      for (const voice of engine.voices.values()) {
        voice.osc.onended = null
        voice.osc.stop()
        voice.osc.disconnect()
        voice.gain.disconnect()
        voice.panner.disconnect()
      }
      engine.voices.clear()
      engine.master?.disconnect()
      engine.master = null
      void engine.ctx?.close()
      engine.ctx = null
    }
  }, [])
}
