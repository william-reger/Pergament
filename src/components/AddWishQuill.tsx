import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Feather,
  Link2,
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  FolderEdit,
  Trash2,
} from 'lucide-react'
import type {
  CategoryMeta,
  TapeStyle,
  WishItem,
} from '../types'
import { MAGICAL_SKETCH_PRESETS } from '../data/initialWishes'
import { triggerMagicBurst } from './MagicCanvasFX'
import { magicAudio } from '../utils/magicAudio'

interface AddWishQuillProps {
  onAddWish: (wish: WishItem) => void
  categories: CategoryMeta[]
  onUpdateCategories: (cats: CategoryMeta[]) => void
  defaultCategory?: string
}

const TAPE_STYLES: TapeStyle[] = ['wax-red', 'wax-gold', 'tape', 'pin']
const INK_PALETTE = ['#7c2d12', '#1e3a8a', '#4c1d95', '#713f12', '#065f46', '#581c87']

export const AddWishQuill: React.FC<AddWishQuillProps> = ({
  onAddWish,
  categories,
  onUpdateCategories,
  defaultCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isCatEditorOpen, setIsCatEditorOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState<string>(
    defaultCategory || categories[0]?.id || 'socken'
  )
  const [priority, setPriority] = useState<1 | 2 | 3>(2)
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null)
  const [showCustomImageInput, setShowCustomImageInput] = useState(false)

  // New Category fields
  const [newCatEmoji, setNewCatEmoji] = useState('✨')
  const [newCatLabel, setNewCatLabel] = useState('')

  const conjureFromLink = async (targetUrl: string) => {
    const trimmed = targetUrl.trim()
    if (!trimmed || !/^https?:\/\//i.test(trimmed)) return

    setIsScraping(true)
    setScrapeStatus('Lese Link und hole Bild...')

    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (data.title && !title.trim()) {
        setTitle(data.title)
      }
      if (data.image) {
        setImageUrl(data.image)
      }
      if (data.price && !price.trim()) {
        setPrice(data.price)
      }
      if (data.description && !note.trim()) {
        setNote(data.description.slice(0, 120))
      }

      magicAudio.playMagicChime('add')
      triggerMagicBurst({ color: '#38bdf8', count: 14 })

      if (data.image) {
        setScrapeStatus('✨ Bild & Name geladen!')
      } else {
        setScrapeStatus('Link erkannt – wähle rechts ein Bild oder eine Skizze.')
        setShowCustomImageInput(true)
      }
    } catch {
      setScrapeStatus('Titel & Bild bitte manuell eintragen.')
    } finally {
      setIsScraping(false)
      setTimeout(() => setScrapeStatus(null), 4000)
    }
  }

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim()
    if (/^https?:\/\//i.test(pasted)) {
      setTimeout(() => {
        conjureFromLink(pasted)
      }, 60)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !url.trim()) return

    const finalTitle =
      title.trim() ||
      (() => {
        try {
          return `Wunsch (${new URL(url).hostname.replace(/^www\./, '')})`
        } catch {
          return 'Neuer Wunsch'
        }
      })()

    const randomRotation = Number((Math.random() * 5.2 - 2.6).toFixed(2))
    const randomTape = TAPE_STYLES[Math.floor(Math.random() * TAPE_STYLES.length)]

    const newWish: WishItem = {
      id: `wish-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: finalTitle,
      note: note.trim() || undefined,
      url: url.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      price: price.trim() || undefined,
      category: categories.some((c) => c.id === category)
        ? category
        : categories[0]?.id || 'socken',
      priority,
      fulfilled: false,
      rotation: randomRotation,
      tapeStyle: randomTape,
      createdAt: Date.now(),
    }

    onAddWish(newWish)
    magicAudio.playMagicChime('add')
    triggerMagicBurst({ color: '#fbbf24', count: 16 })

    setUrl('')
    setTitle('')
    setNote('')
    setPrice('')
    setImageUrl('')
    setShowCustomImageInput(false)
    setIsOpen(false)
  }

  const handleRenameCategory = (id: string, field: 'label' | 'emoji', value: string) => {
    onUpdateCategories(
      categories.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) return
    onUpdateCategories(categories.filter((c) => c.id !== id))
  }

  const handleAddCategory = () => {
    if (!newCatLabel.trim()) return
    const id = `cat-${Date.now().toString(36)}`
    const inkColor = INK_PALETTE[categories.length % INK_PALETTE.length]
    onUpdateCategories([
      ...categories,
      {
        id,
        label: newCatLabel.trim(),
        emoji: newCatEmoji.trim() || '✦',
        inkColor,
      },
    ])
    setNewCatLabel('')
    setNewCatEmoji('✨')
  }

  return (
    <div className="quill-station-container">
      <div className="edit-toolbar-row">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`quill-write-trigger ${isOpen ? 'active' : ''}`}
        >
          <span className="quill-trigger-left">
            <Feather className="quill-feather-icon" size={18} />
            <span>Neuen Wunsch hinzufügen...</span>
          </span>
          <span className="quill-trigger-right">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsCatEditorOpen(!isCatEditorOpen)}
          className={`cat-manage-trigger ${isCatEditorOpen ? 'active' : ''}`}
          title="Kategorien bearbeiten"
        >
          <FolderEdit size={17} />
          <span>Kategorien</span>
        </button>
      </div>

      {/* KATEGORIEN-EDITOR (/edit) */}
      <AnimatePresence>
        {isCatEditorOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="quill-form-drawer"
          >
            <div className="quill-form-inner category-editor-box">
              <div className="ink-field-label">Kategorien anpassen (Symbol, Name &amp; Anzahl):</div>
              <div className="cat-edit-list">
                {categories.map((cat) => (
                  <div key={cat.id} className="cat-edit-item">
                    <input
                      type="text"
                      value={cat.emoji}
                      onChange={(e) =>
                        handleRenameCategory(cat.id, 'emoji', e.target.value)
                      }
                      className="parchment-input cat-emoji-input"
                      aria-label="Symbol"
                    />
                    <input
                      type="text"
                      value={cat.label}
                      onChange={(e) =>
                        handleRenameCategory(cat.id, 'label', e.target.value)
                      }
                      className="parchment-input cat-name-input"
                      aria-label="Kategoriename"
                    />
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="quill-icon-btn delete-btn"
                        title="Kategorie entfernen"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="cat-add-row">
                <input
                  type="text"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  className="parchment-input cat-emoji-input"
                  placeholder="✨"
                />
                <input
                  type="text"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  placeholder="Neue Kategorie..."
                  className="parchment-input cat-name-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="conjure-link-btn"
                >
                  <Plus size={15} />
                  <span>Hinzufügen</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WUNSCH HINZUFÜGEN FORMULAR */}
      <AnimatePresence>
        {isOpen && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="quill-form-drawer"
          >
            <div className="quill-form-inner">
              <div className="link-conjure-box">
                <label className="ink-field-label">
                  <Link2 size={14} />
                  <span>Link einfügen (lädt Bild &amp; Titel):</span>
                </label>
                <div className="link-input-row">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onPaste={handleUrlPaste}
                    placeholder="https://..."
                    className="parchment-input link-main-input"
                  />
                  <button
                    type="button"
                    onClick={() => conjureFromLink(url)}
                    disabled={isScraping || !url.trim()}
                    className="conjure-link-btn"
                  >
                    {isScraping ? (
                      <Loader2 size={15} className="spin-icon" />
                    ) : (
                      <Wand2 size={15} />
                    )}
                    <span>{isScraping ? 'Lade...' : 'Bild holen'}</span>
                  </button>
                </div>
                {scrapeStatus && (
                  <p className="scrape-whisper-status">{scrapeStatus}</p>
                )}
              </div>

              <div className="quill-main-split">
                <div className="quill-fields-column">
                  <div className="field-group">
                    <label className="ink-field-label">Name des Wunsches:</label>
                    <input
                      type="text"
                      required={!url.trim()}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Wunsch..."
                      className="parchment-input title-handwriting-input"
                    />
                  </div>

                  <div className="field-group">
                    <label className="ink-field-label">Notiz (optional):</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Größe, Farbe, Details..."
                      rows={2}
                      className="parchment-textarea"
                    />
                  </div>

                  <div className="quill-meta-row">
                    <div className="field-group price-field">
                      <label className="ink-field-label">Taler / Preis:</label>
                      <input
                        type="text"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="z.B. 24,90 €"
                        className="parchment-input"
                      />
                    </div>

                    <div className="field-group prio-field">
                      <label className="ink-field-label">Wichtigkeit:</label>
                      <div className="prio-selector-pills">
                        {(
                          [
                            { lvl: 1, label: '✦ Nett' },
                            { lvl: 2, label: '✦✦ Groß' },
                            { lvl: 3, label: '✦✦✦ Herzenswunsch' },
                          ] as const
                        ).map((item) => (
                          <button
                            key={item.lvl}
                            type="button"
                            onClick={() => setPriority(item.lvl)}
                            className={`prio-pill ${priority === item.lvl ? 'selected' : ''}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="ink-field-label">Kategorie:</label>
                    <div className="category-stamp-grid">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`cat-stamp-option ${
                            category === cat.id ? 'selected' : ''
                          }`}
                          style={
                            {
                              '--cat-ink': cat.inkColor,
                            } as React.CSSProperties
                          }
                        >
                          <span className="cat-emoji">{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="quill-polaroid-preview-col">
                  <div className="preview-polaroid-card">
                    <div className="attachment-wax wax-red preview-wax">
                      <span>✦</span>
                    </div>
                    <div className="preview-img-frame">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Vorschau" />
                      ) : (
                        <div className="empty-preview-sketch">
                          <Sparkles size={22} />
                          <span>Vorschaubild</span>
                        </div>
                      )}
                    </div>
                    <div className="preview-controls">
                      <label className="mini-paper-btn">
                        <ImageIcon size={13} />
                        <span>Datei</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          hidden
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCustomImageInput(!showCustomImageInput)}
                        className="mini-paper-btn"
                      >
                        <span>URL / Skizze</span>
                      </button>
                    </div>
                  </div>

                  {showCustomImageInput && (
                    <div className="custom-image-popover">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Bild-URL..."
                        className="parchment-input mini-url-input"
                      />
                      <div className="sketch-preset-row">
                        {MAGICAL_SKETCH_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setImageUrl(preset.url)}
                            className="sketch-preset-chip"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="quill-submit-row">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="ink-cancel-link"
                >
                  Schließen
                </button>
                <button type="submit" className="royal-wax-submit-btn">
                  <Plus size={17} />
                  <span>Aufschreiben</span>
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
