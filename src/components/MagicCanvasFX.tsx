import React, { useEffect, useRef } from 'react'

export interface MagicBurstDetail {
  x?: number
  y?: number
  color?: string
  count?: number
}

export function triggerMagicBurst(detail: MagicBurstDetail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('magic-burst', { detail }))
  }
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  maxAlpha: number
  color: string
  life: number
  maxLife: number
  twinkleSpeed: number
  twinklePhase: number
}

const MAGIC_COLORS = [
  '#fbbf24', // Gold
  '#f59e0b', // Bernstein
  '#fde68a', // Sternenlicht
  '#38bdf8', // Arkan-Cyan
]

export const MagicCanvasFX: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Sehr ressourcenschonende Anzahl an Hintergrund-Glühfunken (max 14)
    const ambientCount = 14
    const ambientParticles: Particle[] = Array.from({ length: ambientCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.3 - 0.08,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5,
      maxAlpha: Math.random() * 0.5 + 0.2,
      color: MAGIC_COLORS[Math.floor(Math.random() * MAGIC_COLORS.length)],
      life: 0,
      maxLife: Infinity,
      twinkleSpeed: Math.random() * 0.02 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
    }))

    const burstParticles: Particle[] = []

    const spawnBurst = (
      originX: number,
      originY: number,
      customColor?: string,
      count: number = 12
    ) => {
      const cappedCount = Math.min(count, 16)
      for (let i = 0; i < cappedCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 3.2 + 0.6
        burstParticles.push({
          x: originX + (Math.random() - 0.5) * 12,
          y: originY + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          size: Math.random() * 2.5 + 1.2,
          alpha: 0.9,
          maxAlpha: 0.9,
          color:
            customColor ||
            MAGIC_COLORS[Math.floor(Math.random() * MAGIC_COLORS.length)],
          life: 0,
          maxLife: Math.random() * 30 + 20,
          twinkleSpeed: 0.1,
          twinklePhase: 0,
        })
      }
    }

    const handleCustomBurst = (e: Event) => {
      const customEvent = e as CustomEvent<MagicBurstDetail>
      const { x, y, color, count } = customEvent.detail || {}
      spawnBurst(
        x ?? width / 2,
        y ?? height / 2,
        color,
        count ?? 12
      )
    }
    window.addEventListener('magic-burst', handleCustomBurst)

    let lastMouseTime = 0
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastMouseTime < 95) return
      lastMouseTime = now

      if (burstParticles.length > 35) return

      burstParticles.push({
        x: e.clientX + (Math.random() - 0.5) * 8,
        y: e.clientY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 0.7 - 0.15,
        size: Math.random() * 2 + 1,
        alpha: 0.65,
        maxAlpha: 0.65,
        color: MAGIC_COLORS[Math.floor(Math.random() * 3)],
        life: 0,
        maxLife: 22,
        twinkleSpeed: 0.08,
        twinklePhase: 0,
      })
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Leichtgewichtiger Glow ohne teuren Canvas shadowBlur
    const drawGlowingDot = (x: number, y: number, r: number, color: string, alpha: number) => {
      ctx.fillStyle = color
      ctx.globalAlpha = alpha * 0.25
      ctx.beginPath()
      ctx.arc(x, y, r * 2.6, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (const p of ambientParticles) {
        p.x += p.vx
        p.y += p.vy
        p.twinklePhase += p.twinkleSpeed

        if (p.y < -10) p.y = height + 10
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10

        const currentAlpha =
          ((Math.sin(p.twinklePhase) + 1) * 0.5) * p.maxAlpha

        drawGlowingDot(p.x, p.y, p.size, p.color, currentAlpha)
      }

      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const p = burstParticles[i]
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.96
        p.vy *= 0.96
        p.life++

        const progress = p.life / p.maxLife
        if (progress >= 1) {
          burstParticles.splice(i, 1)
          continue
        }

        const fadeAlpha = (1 - progress) * p.maxAlpha
        drawGlowingDot(
          p.x,
          p.y,
          p.size * (1 - progress * 0.3),
          p.color,
          Math.max(0, fadeAlpha)
        )
      }

      ctx.globalAlpha = 1
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('magic-burst', handleCustomBurst)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="magic-canvas-overlay"
      aria-hidden="true"
    />
  )
}
