export type CategoryId = string

export type TapeStyle = 'wax-red' | 'wax-gold' | 'tape' | 'pin'

export type SortMode =
  | 'sternenstaub' // Herzenswünsche / Wichtigkeit
  | 'taler-auf'    // Kleine Taler zuerst
  | 'taler-ab'     // Große Taler zuerst

export interface WishItem {
  id: string
  title: string
  note?: string
  url?: string
  imageUrl?: string
  price?: string
  category: string
  priority: 1 | 2 | 3
  fulfilled: boolean
  rotation: number
  tapeStyle: TapeStyle
  createdAt: number
}

export interface CategoryMeta {
  id: string
  label: string
  emoji: string
  inkColor: string
}

export const DEFAULT_CATEGORIES: CategoryMeta[] = [
  {
    id: 'socken',
    label: 'Socken & Stoff',
    emoji: '🧦',
    inkColor: '#7c2d12',
  },
  {
    id: 'technik',
    label: 'Apparate',
    emoji: '⚙️',
    inkColor: '#1e3a8a',
  },
  {
    id: 'bucher',
    label: 'Schriften',
    emoji: '📖',
    inkColor: '#4c1d95',
  },
  {
    id: 'schatze',
    label: 'Schätze',
    emoji: '💎',
    inkColor: '#713f12',
  },
  {
    id: 'erlebnisse',
    label: 'Abenteuer',
    emoji: '🧭',
    inkColor: '#065f46',
  },
]
