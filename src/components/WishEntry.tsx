import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Feather, Trash2, Sparkles, Check, X, Image as ImageIcon } from 'lucide-react'
import type { CategoryMeta, WishItem } from '../types'
import { MAGICAL_SKETCH_PRESETS } from '../data/initialWishes'
import { triggerMagicBurst } from './MagicCanvasFX'
import { magicAudio } from '../utils/magicAudio'

interface WishEntryProps {
  wish: WishItem
  index: number
  categories: CategoryMeta[]
  isEditMode: boolean
  onToggleFulfilled: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (updated: WishItem) => void
  isHighlighted?: boolean
}

export const WishEntry: React.FC<WishEntryProps> = ({
  wish,
  index,
  categories,
  isEditMode,
  onToggleFulfilled,
  onDelete,
  onUpdate,
  isHighlighted = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(wish.title)
  const [editNote, setEditNote] = useState(wish.note || '')
  const [editPrice, setEditPrice] = useState(wish.price || '')
  const [editUrl, setEditUrl] = useState(wish.url || '')
  const [editImageUrl, setEditImageUrl] = useState(wish.imageUrl || '')
  const [editCategory, setEditCategory] = useState<string>(wish.category)
  const [editPriority, setEditPriority] = useState<1 | 2 | 3>(wish.priority)
  const [imgError, setImgError] = useState(false)

  const fallbackSketch =
    wish.category === 'socken'
      ? MAGICAL_SKETCH_PRESETS[0].url
      : wish.category === 'bucher'
        ? MAGICAL_SKETCH_PRESETS[1].url
        : wish.category === 'erlebnisse'
          ? MAGICAL_SKETCH_PRESETS[3].url
          : MAGICAL_SKETCH_PRESETS[2].url

  const displayImage = !imgError && wish.imageUrl ? wish.imageUrl : fallbackSketch

  const handleCheckboxClick = (e: React.MouseEvent) => {
    if (!isEditMode) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    triggerMagicBurst({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color: '#fbbf24',
      count: 10,
    })
    magicAudio.playMagicChime('check')
    onToggleFulfilled(wish.id)
  }

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return
    setImgError(false)
    onUpdate({
      ...wish,
      title: editTitle.trim(),
      note: editNote.trim() || undefined,
      price: editPrice.trim() || undefined,
      url: editUrl.trim() || undefined,
      imageUrl: editImageUrl.trim() || undefined,
      category: editCategory,
      priority: editPriority,
    })
    setIsEditing(false)
    magicAudio.playMagicChime('add')
  }

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditImageUrl(reader.result)
        setImgError(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 26,
        delay: Math.min(index * 0.02, 0.15),
      }}
      className={`parchment-wish-entry ${wish.fulfilled ? 'is-fulfilled' : ''} ${
        isHighlighted ? 'is-oracle-chosen' : ''
      }`}
    >
      {/* Angeheftetes Polaroid / Bild */}
      <div
        className="wish-polaroid-wrapper"
        style={{ transform: `rotate(${wish.rotation}deg)` }}
      >
        {wish.tapeStyle === 'wax-red' && (
          <div className="attachment-wax wax-red">
            <span>✦</span>
          </div>
        )}
        {wish.tapeStyle === 'wax-gold' && (
          <div className="attachment-wax wax-gold">
            <span>❂</span>
          </div>
        )}
        {wish.tapeStyle === 'tape' && <div className="attachment-tape" />}
        {wish.tapeStyle === 'pin' && <div className="attachment-pin" />}

        <div className="wish-polaroid-frame">
          <div className="wish-polaroid-img-box">
            <img
              src={displayImage}
              alt={wish.title}
              loading="lazy"
              onError={() => setImgError(true)}
            />
            <div className="polaroid-inner-vignette" />
          </div>
          {wish.price && (
            <div className="polaroid-caption">
              <span>{wish.price}</span>
            </div>
          )}
        </div>
      </div>

      {/* Handschrift direkt auf dem Zettel */}
      <div className="wish-handwriting-body">
        {!isEditing ? (
          <>
            <div className="wish-header-row">
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleCheckboxClick}
                  className="ink-checkbox"
                  title={
                    wish.fulfilled
                      ? 'Wunsch wieder öffnen'
                      : 'Als erfüllt durchstreichen'
                  }
                >
                  <svg viewBox="0 0 32 32" className="ink-checkbox-svg">
                    <path
                      d="M5 7 C12 5, 22 6, 27 6 C27 13, 26 21, 26 27 C19 26, 11 27, 5 26 C6 19, 5 12, 5 7 Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {wish.fulfilled && (
                      <path
                        d="M8 16.5 L14 22.5 L26 8.5"
                        fill="none"
                        stroke="#b91c1c"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </button>
              )}

              <div className="wish-title-container">
                <h3 className="wish-title-text">
                  {wish.title}
                  {wish.fulfilled && (
                    <svg
                      className="ink-strikethrough-svg"
                      viewBox="0 0 400 24"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M2 14 Q 110 8, 210 13 T 398 11"
                        fill="none"
                        stroke="#991b1b"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </h3>

                <div className="wish-badges-row">
                  <span
                    className="stardust-priority"
                    title={
                      wish.priority === 3
                        ? 'Herzenswunsch'
                        : wish.priority === 2
                          ? 'Großer Wunsch'
                          : 'Schöne Idee'
                    }
                  >
                    {Array.from({ length: wish.priority }).map((_, i) => (
                      <span key={i} className="star-rune">
                        ✦
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {wish.note && <p className="wish-note-text">{wish.note}</p>}

            <div className="wish-footer-actions">
              {wish.url ? (
                <a
                  href={wish.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="magical-link-seal"
                >
                  <ExternalLink size={13} />
                  <span>
                    ~{' '}
                    {(() => {
                      try {
                        return new URL(wish.url).hostname.replace(/^www\./, '')
                      } catch {
                        return 'Link öffnen'
                      }
                    })()}{' '}
                    ~
                  </span>
                </a>
              ) : (
                <span />
              )}

              {isEditMode && (
                <div className="quill-action-buttons">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="quill-icon-btn"
                    title="Bearbeiten"
                  >
                    <Feather size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(wish.id)}
                    className="quill-icon-btn delete-btn"
                    title="Löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="wish-inline-editor">
            <div className="editor-title-bar">
              <Sparkles size={14} />
              <span>Wunsch bearbeiten</span>
            </div>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Wunschname..."
              className="parchment-input"
            />
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Notiz..."
              rows={2}
              className="parchment-textarea"
            />
            <div className="editor-grid-row">
              <input
                type="text"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Preis (z.B. 29,90 €)"
                className="parchment-input"
              />
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="parchment-select"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="editor-grid-row">
              <input
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="Shop-Link (https://...)"
                className="parchment-input"
              />
              <div className="priority-picker-inline">
                <span>Wichtigkeit:</span>
                {([1, 2, 3] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEditPriority(lvl)}
                    className={`prio-star-btn ${editPriority >= lvl ? 'active' : ''}`}
                  >
                    ✦
                  </button>
                ))}
              </div>
            </div>
            <div className="editor-image-row">
              <input
                type="text"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="Bild-URL..."
                className="parchment-input"
              />
              <label className="upload-parchment-label">
                <ImageIcon size={14} />
                <span>Eigenes Bild</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  hidden
                />
              </label>
            </div>

            <div className="editor-actions-row">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="wax-action-btn cancel"
              >
                <X size={14} /> Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="wax-action-btn save"
              >
                <Check size={14} /> Speichern
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  )
}
