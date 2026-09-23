import { useEffect, useRef } from 'react'
import type { Tone } from './types'

interface Voice {
  osc: OscillatorNode
  gain: GainNode
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
      limiter.threshold.value = -6
      limiter.knee.value = 6
      limiter.ratio.value = 12
      limiter.attack.value = 0.003
      limiter.release.value = 0.25
      limiter.connect(ctx.destination)

      const master = ctx.createGain()
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
      let voice = engine.voices.get(tone.id)
      if (voice === undefined) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        gain.gain.value = 0
        osc.connect(gain)
        gain.connect(engine.master)
        osc.onended = () => {
          osc.disconnect()
          gain.disconnect()
        }
        osc.start()
        voice = { osc, gain }
        engine.voices.set(tone.id, voice)
      }
      voice.osc.type = tone.wave
      voice.osc.frequency.setTargetAtTime(tone.freq, ctx.currentTime, 0.015)
      voice.gain.gain.setTargetAtTime(tone.volume, ctx.currentTime, 0.02)
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
      }
      engine.voices.clear()
      engine.master?.disconnect()
      engine.master = null
      void engine.ctx?.close()
      engine.ctx = null
    }
  }, [])
}
