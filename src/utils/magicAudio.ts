// Reine Web-Audio-API Klangmagie (ohne externe Sound-Dateien)

class MagicAudioEngine {
  private ctx: AudioContext | null = null
  public enabled: boolean = true

  private getContext(): AudioContext | null {
    if (!this.enabled) return null
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public playMagicChime(variant: 'add' | 'reveal' | 'check' = 'add') {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes =
      variant === 'reveal'
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51] // C5, E5, G5, C6, E6
        : variant === 'check'
          ? [440, 554.37, 659.25] // A4, C#5, E5
          : [587.33, 739.99, 880, 1174.66] // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.065)

      gain.gain.setValueAtTime(0.0001, now + idx * 0.065)
      gain.gain.exponentialRampToValueAtTime(0.06, now + idx * 0.065 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.065 + 1.1)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.065)
      osc.stop(now + idx * 0.065 + 1.15)
    })
  }

  public playOracleShuffleStep(stepIndex: number) {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const scale = [392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 783.99, 880.0]
    const freq = scale[stepIndex % scale.length]

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.17)
  }

  public playSockRustle() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const bufferSize = ctx.sampleRate * 0.18
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI)
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(900, now)
    filter.Q.setValueAtTime(1.8, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(now)
  }
}

export const magicAudio = new MagicAudioEngine()
