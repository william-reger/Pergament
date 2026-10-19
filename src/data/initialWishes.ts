import type { WishItem } from '../types'

// Handcrafted SVG parchment sketches encoded as data URLs for fallback & atmospheric items
export const MAGICAL_SKETCH_PRESETS: { label: string; url: string }[] = [
  {
    label: 'Kuschel-Socken',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" fill="none">
        <rect width="300" height="260" fill="#f6ead4"/>
        <circle cx="150" cy="130" r="95" stroke="#c8a97e" stroke-width="1.5" stroke-dasharray="6 4" fill="#efe0c4" opacity="0.6"/>
        <path d="M120 55 L165 55 L162 135 C162 150 185 158 195 170 C208 185 198 208 175 208 L125 208 C108 208 102 192 108 175 L118 140 Z" fill="#d97742" stroke="#4a2511" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M119 72 L164 72 M119 82 L164 82" stroke="#f6ead4" stroke-width="4" stroke-linecap="round"/>
        <path d="M108 175 C125 168 138 182 132 207" stroke="#f6ead4" stroke-width="3" fill="none"/>
        <path d="M168 164 C162 182 175 198 196 192" stroke="#f6ead4" stroke-width="3" fill="none"/>
        <circle cx="90" cy="85" r="3" fill="#d4af37"/>
        <circle cx="210" cy="110" r="4" fill="#d4af37"/>
        <path d="M200 65 L204 75 L214 79 L204 83 L200 93 L196 83 L186 79 L196 75 Z" fill="#d4af37"/>
        <text x="150" y="242" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#5c3a21">~ Verzauberte Wollsocken ~</text>
      </svg>
    `)}`,
  },
  {
    label: 'Altes Buch',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" fill="none">
        <rect width="300" height="260" fill="#f4e7ce"/>
        <circle cx="150" cy="125" r="90" stroke="#bfa074" stroke-width="1.5" stroke-dasharray="4 4" fill="#ead8b8" opacity="0.5"/>
        <path d="M75 85 C105 75 135 82 150 95 C165 82 195 75 225 85 L225 185 C195 175 165 182 150 195 C135 182 105 175 75 185 Z" fill="#fdf6e7" stroke="#3d2314" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M150 95 L150 195" stroke="#3d2314" stroke-width="3"/>
        <path d="M92 110 L135 106 M92 125 L135 121 M92 140 L130 137 M165 106 L208 110 M165 121 L208 125 M165 137 L202 140" stroke="#7c5836" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M150 45 L155 60 L170 65 L155 70 L150 85 L145 70 L130 65 L145 60 Z" fill="#d99b26"/>
        <text x="150" y="240" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#5c3a21">~ Geheimnisvoller Foliant ~</text>
      </svg>
    `)}`,
  },
  {
    label: 'Schatz & Kristall',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" fill="none">
        <rect width="300" height="260" fill="#f5e9d2"/>
        <polygon points="150,45 190,95 175,195 125,195 110,95" fill="#7dd3fc" fill-opacity="0.45" stroke="#2c1810" stroke-width="3.5" stroke-linejoin="round"/>
        <polyline points="150,45 150,195" stroke="#2c1810" stroke-width="2"/>
        <polyline points="110,95 150,115 190,95" stroke="#2c1810" stroke-width="2"/>
        <path d="M95 70 L99 80 L109 84 L99 88 L95 98 L91 88 L81 84 L91 80 Z" fill="#eab308"/>
        <path d="M210 120 L213 128 L221 131 L213 134 L210 142 L207 134 L199 131 L207 128 Z" fill="#eab308"/>
        <text x="150" y="240" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#5c3a21">~ Arkanes Artefakt ~</text>
      </svg>
    `)}`,
  },
  {
    label: 'Reise-Kompass',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" fill="none">
        <rect width="300" height="260" fill="#f4e8d1"/>
        <circle cx="150" cy="125" r="72" fill="#fbf3e4" stroke="#3d2314" stroke-width="4"/>
        <circle cx="150" cy="125" r="62" stroke="#8c6239" stroke-width="1.5" stroke-dasharray="5 3"/>
        <polygon points="150,68 164,125 150,115 136,125" fill="#b91c1c" stroke="#3d2314" stroke-width="2"/>
        <polygon points="150,182 164,125 150,135 136,125" fill="#d6c5a9" stroke="#3d2314" stroke-width="2"/>
        <circle cx="150" cy="125" r="6" fill="#d97706" stroke="#3d2314" stroke-width="2"/>
        <text x="150" y="240" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#5c3a21">~ Reise ins Unbekannte ~</text>
      </svg>
    `)}`,
  },
]

export const INITIAL_WISHES: WishItem[] = [
  {
    id: 'wish-socken-1',
    title: 'Norwegische Hütten-Wollsocken (Drachenschuppen-Strick)',
    note: 'Größe 41–42, am liebsten in warmem Rostrot oder Waldgrün für kalte Winterabende.',
    url: 'https://www.etsy.com/de/search?q=handgestrickte+wollsocken',
    imageUrl: MAGICAL_SKETCH_PRESETS[0].url,
    price: '28,00 €',
    category: 'socken',
    priority: 3,
    fulfilled: false,
    rotation: -2.4,
    tapeStyle: 'wax-red',
    createdAt: Date.now() - 3600 * 1000 * 5,
  },
  {
    id: 'wish-technik-1',
    title: 'Mechanische Schreibmaschinen-Tastatur mit warmem Licht',
    note: 'Mit taktilen Switches, die wie das Klackern alter Zaubermaschinen klingen.',
    url: 'https://www.keychron.com',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    price: '119,00 €',
    category: 'technik',
    priority: 3,
    fulfilled: false,
    rotation: 1.8,
    tapeStyle: 'tape',
    createdAt: Date.now() - 3600 * 1000 * 4,
  },
  {
    id: 'wish-bucher-1',
    title: 'Illustrierte Prachtausgabe: Der Herr der Ringe (Ledereinband)',
    note: 'Mit Goldschnitt und den originalen Karten von Mittelerde zum Ausfalten.',
    url: 'https://www.thalia.de',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    price: '78,00 €',
    category: 'bucher',
    priority: 2,
    fulfilled: false,
    rotation: -1.5,
    tapeStyle: 'wax-gold',
    createdAt: Date.now() - 3600 * 1000 * 3,
  },
  {
    id: 'wish-schatze-1',
    title: 'Handgegossene Bienenwachskerze & Messing-Kerzenhalter',
    note: 'Für echtes Tavernen-Flair auf dem Schreibtisch beim Lesen.',
    url: 'https://www.manufactum.de',
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80',
    price: '34,50 €',
    category: 'schatze',
    priority: 2,
    fulfilled: false,
    rotation: 2.6,
    tapeStyle: 'pin',
    createdAt: Date.now() - 3600 * 1000 * 2,
  },
  {
    id: 'wish-socken-2',
    title: 'Bunte Alpakawolle-Socken mit Sternbildern',
    note: 'Man kann nie genug gute Socken in der Schublade haben!',
    url: 'https://www.dedoles.de',
    imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=600&q=80',
    price: '16,90 €',
    category: 'socken',
    priority: 1,
    fulfilled: false,
    rotation: -2.1,
    tapeStyle: 'tape',
    createdAt: Date.now() - 3600 * 1000 * 1,
  },
]
