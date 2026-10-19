# 📜 Magischer Wunschzettel

Eine interaktive Wunschliste im Stil eines verzauberten, angerissenen Pergaments.

## ✍️ Wünsche & Kategorien pflegen (`wishlist.json`)

Alle Wünsche, Kategorien und die Überschrift liegen zentral in der Datei **[`wishlist.json`](./wishlist.json)** im Hauptverzeichnis.  
Du kannst diese Datei direkt im Code-Editor oder auf GitHub bearbeiten (oder lokal unter `http://localhost:5173/edit`, wobei Änderungen automatisch in `wishlist.json` gespeichert werden).

### Aufbau der `wishlist.json`:

```json
{
  "title": "William 2026",
  "categories": [
    {
      "id": "socken",
      "name": "Socken",
      "emoji": "🧦",
      "inkColor": "#7c2d12"
    }
  ],
  "wishes": [
    {
      "name": "Kuschelige Norweger-Wollsocken",
      "description": "Größe 42–43, gerne in warmem Rostrot oder Waldgrün für den Winter.",
      "url": "https://www.etsy.com/de/search?q=norweger+wollsocken",
      "image": "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=600&q=80",
      "price": "24,90 €",
      "category": "socken",
      "priority": 3,
      "attachment": "wax-red",
      "fulfilled": false
    }
  ]
}
```

### Felder eines Wunsches:
| Feld | Beschreibung | Pflicht? |
| :--- | :--- | :--- |
| `name` | Name des Wunsches | Ja |
| `description` | Beschreibung / Notiz (z. B. Größe, Farbe, Details) | Optional |
| `url` | Link zum Shop / Produkt | Optional |
| `image` | Direktlink zum Bild (falls leer, wird eine passende Pergament-Skizze angezeigt) | Optional |
| `price` | Preis (z. B. `"24,90 €"` – wird für die Sortierung *Kleine / Große Taler* genutzt) | Optional |
| `category` | `id` oder `name` einer Kategorie aus `categories` | Ja |
| `priority` | `1` (Nett `✦`), `2` (Groß `✦✦`) oder `3` (Herzenswunsch `✦✦✦`) | Optional (Standard: `2`) |
| `attachment` | Befestigung des Bildes: `"wax-red"`, `"wax-gold"`, `"tape"` oder `"pin"` | Optional (automatisch) |
| `fulfilled` | `true`, wenn der Wunsch bereits erfüllt/durchgestrichen sein soll | Optional (Standard: `false`) |

---

## ☁️ Kostenloses Hosting auf Cloudflare Pages

1. Repository mit **Cloudflare Pages** verbinden (**Workers & Pages** ➔ **Create** ➔ **Pages** ➔ **Connect to Git**).
2. Build-Einstellungen:
   - **Framework Preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Bei jedem `git push` baut und aktualisiert Cloudflare die Seite automatisch.
