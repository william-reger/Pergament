import { useState, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DEFAULT_CATEGORIES,
  type CategoryMeta,
  type SortMode,
  type TapeStyle,
  type WishItem,
} from './types'
import wishlistRaw from '../wishlist.json'
import { MagicCanvasFX, triggerMagicBurst } from './components/MagicCanvasFX'
import { AddWishQuill } from './components/AddWishQuill'
import { WishEntry } from './components/WishEntry'
import { OracleModal } from './components/OracleModal'
import { magicAudio } from './utils/magicAudio'
import './App.css'

const TAPE_ROTATION_PRESETS = [-2.2, 1.7, -1.4, 2.3, -1.9, 1.3]
const TAPE_STYLE_PRESETS: TapeStyle[] = ['wax-red', 'tape', 'wax-gold', 'pin']
const INK_COLORS = ['#7c2d12', '#1e3a8a', '#4c1d95', '#713f12', '#065f46', '#581c87']

interface RawJsonCategory {
  id?: string
  name?: string
  label?: string
  emoji?: string
  inkColor?: string
}

interface RawJsonWish {
  id?: string
  name?: string
  title?: string
  description?: string
  note?: string
  url?: string
  image?: string
  imageUrl?: string
  price?: string
  category?: string
  priority?: number
  attachment?: TapeStyle
  tapeStyle?: TapeStyle
  fulfilled?: boolean
  rotation?: number
  createdAt?: number
}

interface RawWishlistFile {
  title?: string
  categories?: RawJsonCategory[]
  wishes?: RawJsonWish[]
}

function parseWishlistJson(raw: RawWishlistFile): {
  title: string
  categories: CategoryMeta[]
  wishes: WishItem[]
} {
  const title = raw.title || 'Mein Wunschzettel'

  const categories: CategoryMeta[] =
    Array.isArray(raw.categories) && raw.categories.length > 0
      ? raw.categories.map((c, idx) => {
          const label = c.name || c.label || `Kategorie ${idx + 1}`
          const id =
            c.id ||
            label
              .toLowerCase()
              .replace(/[^a-z0-9äöüß]+/g, '-')
              .replace(/^-|-$/g, '') ||
            `cat-${idx}`
          return {
            id,
            label,
            emoji: c.emoji || '✦',
            inkColor: c.inkColor || INK_COLORS[idx % INK_COLORS.length],
          }
        })
      : DEFAULT_CATEGORIES

  const wishes: WishItem[] = Array.isArray(raw.wishes)
    ? raw.wishes.map((w, idx) => {
        // Match category by id or by name/label (case-insensitive)
        const rawCat = (w.category || '').trim()
        const matchedCat =
          categories.find(
            (c) =>
              c.id.toLowerCase() === rawCat.toLowerCase() ||
              c.label.toLowerCase() === rawCat.toLowerCase()
          ) || categories[0]

        const prio =
          w.priority === 1 || w.priority === 2 || w.priority === 3
            ? w.priority
            : 2

        return {
          id: w.id || `wish-${idx}-${ (w.name || w.title || 'item').slice(0, 12).replace(/\s+/g, '-') }`,
          title: w.name || w.title || 'Unbenannter Wunsch',
          note: w.description ?? w.note ?? undefined,
          url: w.url || undefined,
          imageUrl: w.image ?? w.imageUrl ?? undefined,
          price: w.price || undefined,
          category: matchedCat ? matchedCat.id : 'socken',
          priority: prio,
          fulfilled: Boolean(w.fulfilled),
          rotation:
            typeof w.rotation === 'number'
              ? w.rotation
              : TAPE_ROTATION_PRESETS[idx % TAPE_ROTATION_PRESETS.length],
          tapeStyle:
            w.attachment ||
            w.tapeStyle ||
            TAPE_STYLE_PRESETS[idx % TAPE_STYLE_PRESETS.length],
          createdAt: w.createdAt || Date.now() - idx * 1000,
        }
      })
    : []

  return { title, categories, wishes }
}

function serializeToWishlistJson(
  title: string,
  categories: CategoryMeta[],
  wishes: WishItem[]
): RawWishlistFile {
  return {
    title,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.label,
      emoji: c.emoji,
      inkColor: c.inkColor,
    })),
    wishes: wishes.map((w) => ({
      name: w.title,
      description: w.note || '',
      url: w.url || '',
      image: w.imageUrl || '',
      price: w.price || '',
      category: w.category,
      priority: w.priority,
      attachment: w.tapeStyle,
      fulfilled: w.fulfilled,
    })),
  }
}

function parsePriceNumber(priceStr?: string): number {
  if (!priceStr) return 999999
  const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 999999 : num
}

export function App() {
  const initialParsed = useMemo(
    () => parseWishlistJson(wishlistRaw as RawWishlistFile),
    []
  )

  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return (
      window.location.pathname.includes('/edit') ||
      window.location.search.includes('edit') ||
      window.location.hash.includes('edit')
    )
  })

  useEffect(() => {
    const checkUrl = () => {
      setIsEditMode(
        window.location.pathname.includes('/edit') ||
          window.location.search.includes('edit') ||
          window.location.hash.includes('edit')
      )
    }
    window.addEventListener('popstate', checkUrl)
    window.addEventListener('hashchange', checkUrl)
    return () => {
      window.removeEventListener('popstate', checkUrl)
      window.removeEventListener('hashchange', checkUrl)
    }
  }, [])

  const [wishes, setWishes] = useState<WishItem[]>(initialParsed.wishes)
  const [categories, setCategories] = useState<CategoryMeta[]>(
    initialParsed.categories
  )
  const [parchmentTitle, setParchmentTitle] = useState<string>(
    initialParsed.title
  )

  const [sortMode, setSortMode] = useState<SortMode>('sternenstaub')
  const [isOracleOpen, setIsOracleOpen] = useState(false)
  const [highlightedWishId, setHighlightedWishId] = useState<string | null>(null)

  const isFirstRender = useRef(true)

  // Im lokalen /edit Modus wird jede Änderung automatisch in die wishlist.json zurückgeschrieben
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!isEditMode) return

    const payload = serializeToWishlistJson(parchmentTitle, categories, wishes)
    fetch('/api/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }, [wishes, categories, parchmentTitle, isEditMode])

  const handleAddWish = (newWish: WishItem) => {
    setWishes((prev) => [newWish, ...prev])
    setHighlightedWishId(newWish.id)
    setTimeout(() => setHighlightedWishId(null), 4000)
  }

  const handleToggleFulfilled = (id: string) => {
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, fulfilled: !w.fulfilled } : w))
    )
  }

  const handleDeleteWish = (id: string) => {
    setWishes((prev) => prev.filter((w) => w.id !== id))
  }

  const handleUpdateWish = (updated: WishItem) => {
    setWishes((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
  }

  const sortedWishes = useMemo(() => {
    return [...wishes].sort((a, b) => {
      if (a.fulfilled !== b.fulfilled) {
        return a.fulfilled ? 1 : -1
      }

      if (sortMode === 'taler-auf') {
        return parsePriceNumber(a.price) - parsePriceNumber(b.price)
      }
      if (sortMode === 'taler-ab') {
        const pa = parsePriceNumber(a.price)
        const pb = parsePriceNumber(b.price)
        if (pa === 999999 && pb === 999999) return 0
        if (pa === 999999) return 1
        if (pb === 999999) return -1
        return pb - pa
      }
      // 'sternenstaub' (Herzenswünsche)
      return b.priority - a.priority || b.createdAt - a.createdAt
    })
  }, [wishes, sortMode])

  const groupedByCategories = useMemo(() => {
    const knownIds = new Set(categories.map((c) => c.id))
    const groups = categories
      .map((cat) => ({
        category: cat,
        items: sortedWishes.filter((w) => w.category === cat.id),
      }))
      .filter((group) => group.items.length > 0)

    const uncategorized = sortedWishes.filter((w) => !knownIds.has(w.category))
    if (uncategorized.length > 0) {
      groups.push({
        category: {
          id: 'other',
          label: 'Weiteres',
          emoji: '✦',
          inkColor: '#4a2e18',
        },
        items: uncategorized,
      })
    }
    return groups
  }, [categories, sortedWishes])

  return (
    <div className="magical-desk-scene">
      <MagicCanvasFX />
      <div className="ambient-arcane-nebula" />

      <main className="parchment-stage-wrapper">
        {/* Drop-Shadow & Magischer Glow folgt exakt der echten Cutout-Silhouette */}
        <div className="parchment-glow-drop-wrapper">
          <div className="enchanted-paper-sheet">
            {/* Knickfalten & Alterungsspuren auf dem Papier */}
            <div className="paper-creases-overlay" aria-hidden="true" />
            <div className="paper-fiber-overlay" aria-hidden="true" />
            <div className="paper-ruled-lines" aria-hidden="true" />
            <div className="paper-magical-aura-border" aria-hidden="true" />

            {/* Feine weiterlaufende Riss-Fasern im Papier an den transparenten Cutouts */}
            <svg
              className="paper-edge-tears-svg"
              viewBox="0 0 1000 1400"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M 28 224 L 54 231 L 72 227"
                fill="none"
                stroke="rgba(105, 65, 25, 0.45)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M 968 588 L 938 596 L 918 591"
                fill="none"
                stroke="rgba(105, 65, 25, 0.45)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M 24 1008 L 52 1016 L 66 1012"
                fill="none"
                stroke="rgba(105, 65, 25, 0.42)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 700 22 L 694 45 L 702 58"
                fill="none"
                stroke="rgba(105, 65, 25, 0.38)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>

            <span className="corner-rune rune-tl">╔═✦</span>
            <span className="corner-rune rune-tr">✦═╗</span>
            <span className="corner-rune rune-bl">╚═✦</span>
            <span className="corner-rune rune-br">✦═╝</span>

            {/* Zettel-Überschrift (nur in /edit editierbar) */}
            <header className="parchment-header">
              {isEditMode ? (
                <input
                  type="text"
                  value={parchmentTitle}
                  onChange={(e) => setParchmentTitle(e.target.value)}
                  className="parchment-main-title-input"
                  aria-label="Titel des Wunschzettels"
                />
              ) : (
                <h1 className="parchment-main-title-static">{parchmentTitle}</h1>
              )}
            </header>

            {/* Großes mittiges Zufalls-Wachssiegel + Sortierung */}
            <section className="parchment-ritual-bar">
              <div className="top-seal-center-wrap">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.07, rotate: 5 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={(e) => {
                    triggerMagicBurst({
                      x: e.clientX,
                      y: e.clientY,
                      color: '#fbbf24',
                      count: 16,
                    })
                    setIsOracleOpen(true)
                  }}
                  className="bottom-grand-wax-seal top-hero-wax-seal"
                  title="Zufälligen Wunsch ziehen"
                >
                  <span className="grand-seal-inner">
                    <span className="grand-seal-rune">⚝</span>
                    <span className="grand-seal-text">Zufall</span>
                  </span>
                </motion.button>
              </div>

              {/* Sortierung: Nur Herzenswünsche, Kleine Taler, Große Taler */}
              <div className="sort-pills-row">
                {(
                  [
                    { id: 'sternenstaub', label: '✦ Herzenswünsche' },
                    { id: 'taler-auf', label: '🪙 Kleine Taler' },
                    { id: 'taler-ab', label: '👑 Große Taler' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSortMode(opt.id)
                      magicAudio.playSockRustle()
                    }}
                    className={`ink-sort-pill ${sortMode === opt.id ? 'active' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Neue Wünsche & Kategorien-Anpassung NUR unter /edit */}
            {isEditMode && (
              <AddWishQuill
                onAddWish={handleAddWish}
                categories={categories}
                onUpdateCategories={setCategories}
                defaultCategory={categories[0]?.id}
              />
            )}

            {/* WUNSCHLISTE AUF DEM PAPIER */}
            <section className="parchment-wishes-area">
              {sortedWishes.length === 0 ? (
                <div className="empty-parchment-state">
                  <p className="empty-ink-poem">~ Noch unbeschrieben ~</p>
                </div>
              ) : (
                <div className="sock-drawers-container">
                  {groupedByCategories.map((group) => (
                    <div key={group.category.id} className="sock-category-pile">
                      <div className="sock-clothesline-divider">
                        <span
                          className="sock-pile-title"
                          style={{ color: group.category.inkColor }}
                        >
                          <span className="sock-pin-emoji">
                            {group.category.emoji}
                          </span>
                          ~ {group.category.label} ~
                        </span>
                      </div>

                      <div className="wishes-ink-list">
                        <AnimatePresence mode="popLayout">
                          {group.items.map((wish, idx) => (
                            <WishEntry
                              key={wish.id}
                              wish={wish}
                              index={idx}
                              categories={categories}
                              isEditMode={isEditMode}
                              onToggleFulfilled={handleToggleFulfilled}
                              onDelete={handleDeleteWish}
                              onUpdate={handleUpdateWish}
                              isHighlighted={highlightedWishId === wish.id}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Wachssiegel unten */}
            <footer className="parchment-footer-signoff">
              <motion.button
                type="button"
                whileHover={{ scale: 1.06, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  triggerMagicBurst({
                    x: e.clientX,
                    y: e.clientY,
                    color: '#fbbf24',
                    count: 14,
                  })
                  setIsOracleOpen(true)
                }}
                className="bottom-grand-wax-seal"
                title="Zufälligen Wunsch ziehen"
              >
                <span className="grand-seal-inner">
                  <span className="grand-seal-rune">⚝</span>
                  <span className="grand-seal-text">Zufall</span>
                </span>
              </motion.button>
            </footer>
          </div>
        </div>
      </main>

      <OracleModal
        isOpen={isOracleOpen}
        wishes={wishes}
        categories={categories}
        isEditMode={isEditMode}
        onClose={() => setIsOracleOpen(false)}
        onSelectHighlight={(id) => {
          setHighlightedWishId(id)
          setTimeout(() => setHighlightedWishId(null), 6000)
        }}
        onToggleFulfilled={handleToggleFulfilled}
      />
    </div>
  )
}

export default App
