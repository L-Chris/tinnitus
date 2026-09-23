export const octaveSpread = (n: number) => Math.pow(2, n / 2) - Math.pow(2, -n / 2)

export const bandWidthHz = (freq: number, n: number) => freq * octaveSpread(n)

export const octaveQ = (n: number) => Math.sqrt(Math.SQRT2 - 1) / octaveSpread(n)

export const noiseCompensation = (sampleRate: number, freq: number, n: number) =>
  Math.min(20, Math.sqrt((1.5 * sampleRate) / 2 / bandWidthHz(freq, n)))

export const makeNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}
