import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { ExternalLink, RefreshCw, X, Check } from 'lucide-react'
import type { CategoryMeta, WishItem } from '../types'
import { MAGICAL_SKETCH_PRESETS } from '../data/initialWishes'
import { triggerMagicBurst } from './MagicCanvasFX'
import { magicAudio } from '../utils/magicAudio'

interface OracleModalProps {
  isOpen: boolean
  wishes: WishItem[]
  categories: CategoryMeta[]
  isEditMode: boolean
  onClose: () => void
  onSelectHighlight: (wishId: string) => void
  onToggleFulfilled: (wishId: string) => void
}

export const OracleModal: React.FC<OracleModalProps> = ({
  isOpen,
  wishes,
  categories,
  isEditMode,
  onClose,
  onSelectHighlight,
  onToggleFulfilled,
}) => {
  const [isSpinning, setIsSpinning] = useState(false)
  const [previewWish, setPreviewWish] = useState<WishItem | null>(null)
  const [chosenWish, setChosenWish] = useState<WishItem | null>(null)

  const wishesRef = useRef(wishes)
  wishesRef.current = wishes

  const onSelectHighlightRef = useRef(onSelectHighlight)
  onSelectHighlightRef.current = onSelectHighlight

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startOracleDraw = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const currentWishes = wishesRef.current
    const unfulfilled = currentWishes.filter((w) => !w.fulfilled)
    const pool = unfulfilled.length > 0 ? unfulfilled : currentWishes

    if (pool.length === 0) return

    setIsSpinning(true)
    setChosenWish(null)
    setPreviewWish(pool[Math.floor(Math.random() * pool.length)])

    let step = 0
    const totalSteps = 12

    timerRef.current = setInterval(() => {
      step++
      const candidate = pool[Math.floor(Math.random() * pool.length)]
      setPreviewWish(candidate)
      magicAudio.playOracleShuffleStep(step)

      if (step >= totalSteps) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        const winner = pool[Math.floor(Math.random() * pool.length)]
        setPreviewWish(winner)
        setChosenWish(winner)
        setIsSpinning(false)
        onSelectHighlightRef.current(winner.id)

        magicAudio.playMagicChime('reveal')
        triggerMagicBurst({ color: '#fbbf24', count: 16 })

        confetti({
          particleCount: 40,
          spread: 65,
          origin: { y: 0.55 },
          colors: ['#fbbf24', '#f59e0b', '#fde68a', '#d97706'],
        })
      }
    }, 100)
  }, [])

  useEffect(() => {
    if (isOpen) {
      startOracleDraw()
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setChosenWish(null)
      setPreviewWish(null)
      setIsSpinning(false)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOpen, startOracleDraw])

  if (!isOpen) return null

  const activeWish = chosenWish || previewWish
  const catMeta = activeWish
    ? categories.find((c) => c.id === activeWish.category)
    : undefined
  const displayImage =
    activeWish?.imageUrl || MAGICAL_SKETCH_PRESETS[2].url

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="oracle-backdrop"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 24 }}
          className="oracle-parchment-scroll"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="oracle-close-seal"
            aria-label="Schließen"
          >
            <X size={18} />
          </button>

          <div className={`arcane-rune-ring ${isSpinning ? 'spinning-fast' : ''}`}>
            <span>✦ ✧ ❂ ✦ ☽ ✧ ⚝ ❂</span>
          </div>

          <h2 className="oracle-title">
            {isSpinning ? '~ Das Pergament wählt... ~' : '~ Gezogener Wunsch ~'}
          </h2>

          {wishes.length === 0 ? (
            <p className="oracle-empty-msg">Noch keine Wünsche vorhanden.</p>
          ) : (
            activeWish && (
              <motion.div
                key={activeWish.id + (isSpinning ? '-spin' : '-final')}
                initial={{ opacity: 0.7, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="oracle-drawn-item"
              >
                <div className="oracle-polaroid">
                  <div className="attachment-wax wax-gold oracle-wax">
                    <span>❂</span>
                  </div>
                  <img src={displayImage} alt={activeWish.title} />
                  {activeWish.price && (
                    <span className="oracle-price-tag">{activeWish.price}</span>
                  )}
                </div>

                <div className="oracle-wish-details">
                  {catMeta && (
                    <span
                      className="oracle-cat-badge"
                      style={{ color: catMeta.inkColor }}
                    >
                      {catMeta.emoji} {catMeta.label}
                    </span>
                  )}

                  <h3 className="oracle-wish-name">{activeWish.title}</h3>

                  {activeWish.note && (
                    <p className="oracle-wish-note">{activeWish.note}</p>
                  )}

                  <div className="oracle-stars">
                    {Array.from({ length: activeWish.priority }).map((_, i) => (
                      <span key={i}>✦</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          )}

          <div className="oracle-footer-controls">
            <button
              type="button"
              onClick={startOracleDraw}
              disabled={isSpinning}
              className="oracle-btn redraw-btn"
            >
              <RefreshCw size={15} className={isSpinning ? 'spin-icon' : ''} />
              <span>Noch einmal ziehen</span>
            </button>

            {chosenWish?.url && (
              <a
                href={chosenWish.url}
                target="_blank"
                rel="noopener noreferrer"
                className="oracle-btn link-btn"
              >
                <ExternalLink size={15} />
                <span>Zum Link</span>
              </a>
            )}

            {isEditMode && chosenWish && !chosenWish.fulfilled && (
              <button
                type="button"
                onClick={() => {
                  onToggleFulfilled(chosenWish.id)
                  onClose()
                }}
                className="oracle-btn fulfill-btn"
              >
                <Check size={15} />
                <span>Abhaken</span>
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
