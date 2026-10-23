// Checks src/data/catalog.json: schema and per-category minimums, then asks
// YouTube's public oEmbed endpoint (no API key) whether each video still exists,
// allows embedding and belongs to the channel recorded in the catalog.
//
// Usage: npm run check:catalog [-- --offline]
import { readFileSync } from 'node:fs'
import { validateCatalog } from '../src/domain/catalog.js'

const CONCURRENCY = 8
const catalogUrl = new URL('../src/data/catalog.json', import.meta.url)
const catalog = JSON.parse(readFileSync(catalogUrl, 'utf8'))
const { trainers } = JSON.parse(
  readFileSync(new URL('../src/data/trainers.json', import.meta.url), 'utf8'),
)
const offline = process.argv.includes('--offline')

async function checkVideo(video) {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${video.id}`,
  )}`
  try {
    const response = await fetch(url)
    if (response.status === 401 || response.status === 403) {
      return `${video.id}: embedding is disabled`
    }
    if (!response.ok) {
      return `${video.id}: not available (HTTP ${response.status})`
    }
    const data = await response.json()
    if (data.author_name !== video.channel) {
      return `${video.id}: channel is "${data.author_name}", catalog says "${video.channel}"`
    }
    return null
  } catch (error) {
    return `${video.id}: request failed (${error.message})`
  }
}

async function checkOnline(videos) {
  const problems = []
  for (let i = 0; i < videos.length; i += CONCURRENCY) {
    const batch = videos.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(checkVideo))
    problems.push(...results.filter(Boolean))
  }
  return problems
}

const schemaErrors = validateCatalog(catalog, trainers)
if (schemaErrors.length > 0) {
  console.error(`Catalog schema: ${schemaErrors.length} problem(s)`)
  for (const error of schemaErrors) console.error(`  - ${error}`)
  process.exit(1)
}
console.log(`Catalog schema: OK (${catalog.videos.length} videos)`)

if (offline) process.exit(0)

const problems = await checkOnline(catalog.videos)
if (problems.length > 0) {
  console.error(`YouTube availability: ${problems.length} problem(s)`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}
console.log('YouTube availability: OK')
