import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const WISHES_FILE = path.resolve(process.cwd(), 'wishlist.json')

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .trim()
}

function extractMeta(html: string, propertyOrName: string): string | null {
  const regexes = [
    new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${propertyOrName}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${propertyOrName}["']`, 'i'),
  ]
  for (const r of regexes) {
    const match = html.match(r)
    if (match?.[1]) return decodeHtmlEntities(match[1])
  }
  return null
}

function scrapeHtmlMetadata(html: string, targetUrl: string) {
  let parsedUrl: URL | null = null
  try {
    parsedUrl = new URL(targetUrl)
  } catch {
    // ignore
  }

  let title =
    extractMeta(html, 'og:title') ||
    extractMeta(html, 'twitter:title') ||
    extractMeta(html, 'title')

  if (!title) {
    const productTitleMatch = html.match(/id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)
    if (productTitleMatch?.[1]) {
      title = decodeHtmlEntities(productTitleMatch[1].replace(/<[^>]+>/g, ''))
    }
  }
  if (!title) {
    const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (titleTagMatch?.[1]) {
      title = decodeHtmlEntities(titleTagMatch[1].replace(/<[^>]+>/g, ''))
    }
  }

  if (title) {
    title = title
      .replace(/\s*[:|-]\s*Amazon\.[a-z.]+.*$/i, '')
      .replace(/^Amazon\.[a-z.]+\s*:\s*/i, '')
      .trim()
  }

  let image =
    extractMeta(html, 'og:image') ||
    extractMeta(html, 'og:image:secure_url') ||
    extractMeta(html, 'twitter:image') ||
    extractMeta(html, 'image')

  if (!image) {
    const hiResMatch = html.match(/data-old-hires=["'](https?:\/\/[^"']+)["']/i)
    if (hiResMatch?.[1]) image = hiResMatch[1]
  }
  if (!image) {
    const dynamicImgMatch = html.match(/data-a-dynamic-image=["']\{&quot;(https?:\/\/[^&"]+)&quot;/i)
    if (dynamicImgMatch?.[1]) image = decodeHtmlEntities(dynamicImgMatch[1])
  }
  if (!image) {
    const landingImgMatch = html.match(/id=["']landingImage["'][^>]+src=["'](https?:\/\/[^"']+)["']/i)
    if (landingImgMatch?.[1]) image = landingImgMatch[1]
  }

  let price =
    extractMeta(html, 'product:price:amount') ||
    extractMeta(html, 'og:price:amount') ||
    extractMeta(html, 'price')

  const ldJsonMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const match of ldJsonMatches) {
    try {
      const raw = match[1].trim()
      const data = JSON.parse(raw)
      const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data]
      for (const item of items) {
        if (!title && item.name && typeof item.name === 'string') {
          title = decodeHtmlEntities(item.name)
        }
        if (!image && item.image) {
          if (typeof item.image === 'string') image = item.image
          else if (Array.isArray(item.image) && typeof item.image[0] === 'string') image = item.image[0]
          else if (item.image.url) image = item.image.url
        }
        if (!price && item.offers) {
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers
          if (offer?.price) {
            price = `${offer.price} ${offer.priceCurrency || '€'}`
          }
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }

  if (!price) {
    const priceMatch = html.match(/(\d{1,4}[.,]\d{2})\s*€/i) || html.match(/€\s*(\d{1,4}[.,]\d{2})/i)
    if (priceMatch?.[1]) {
      price = `${priceMatch[1].replace('.', ',')} €`
    }
  } else if (price && /^\d+([.,]\d+)?$/.test(price.trim())) {
    price = `${price.trim().replace('.', ',')} €`
  }

  if (!image) {
    const imgMatches = html.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi)
    for (const m of imgMatches) {
      const url = m[1]
      if (!/sprite|logo|icon|avatar|pixel|banner|1x1/i.test(url)) {
        image = url
        break
      }
    }
  }

  if (image && parsedUrl && !image.startsWith('http') && !image.startsWith('data:')) {
    try {
      image = new URL(image, parsedUrl.origin).toString()
    } catch {
      // ignore
    }
  }

  const description =
    extractMeta(html, 'og:description') ||
    extractMeta(html, 'twitter:description') ||
    extractMeta(html, 'description') ||
    ''

  const siteName =
    extractMeta(html, 'og:site_name') ||
    (parsedUrl ? parsedUrl.hostname.replace(/^www\./, '') : '')

  return {
    title: title || (parsedUrl ? parsedUrl.hostname.replace(/^www\./, '') : 'Wunsch'),
    image: image || '',
    price: price || '',
    description: description.slice(0, 180),
    siteName,
    url: targetUrl,
  }
}

function magicalWishlistApiPlugin(): Plugin {
  return {
    name: 'magical-wishlist-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        if (req.url.startsWith('/api/scrape')) {
          const urlObj = new URL(req.url, 'http://localhost')
          const targetUrl = urlObj.searchParams.get('url')

          res.setHeader('Content-Type', 'application/json; charset=utf-8')

          if (!targetUrl) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Keine URL angegeben' }))
            return
          }

          try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 8500)

            const response = await fetch(targetUrl, {
              signal: controller.signal,
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
              },
            })
            clearTimeout(timeout)

            const html = await response.text()
            const metadata = scrapeHtmlMetadata(html, targetUrl)
            res.statusCode = 200
            res.end(JSON.stringify(metadata))
          } catch {
            let fallbackDomain = 'Unbekannter Ort'
            try {
              fallbackDomain = new URL(targetUrl).hostname.replace(/^www\./, '')
            } catch {
              // ignore
            }
            res.statusCode = 200
            res.end(
              JSON.stringify({
                title: `Wunsch von ${fallbackDomain}`,
                image: '',
                price: '',
                description: '',
                siteName: fallbackDomain,
                url: targetUrl,
                scrapeBlocked: true,
              })
            )
          }
          return
        }

        if (req.url === '/api/wishes') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          if (req.method === 'GET') {
            if (fs.existsSync(WISHES_FILE)) {
              try {
                const raw = fs.readFileSync(WISHES_FILE, 'utf-8')
                res.statusCode = 200
                res.end(raw)
                return
              } catch {
                // fallback
              }
            }
            res.statusCode = 200
            res.end(JSON.stringify({ wishes: null }))
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body)
                fs.writeFileSync(WISHES_FILE, JSON.stringify(parsed, null, 2) + '\n', 'utf-8')
                res.statusCode = 200
                res.end(JSON.stringify({ ok: true }))
              } catch (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: String(err) }))
              }
            })
            return
          }
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), magicalWishlistApiPlugin()],
})
