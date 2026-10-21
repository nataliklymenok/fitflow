// Prints a few generated plans for review (Checkpoint A).
// Usage: npm run sample:plans [-- <seed>]
import { readFileSync } from 'node:fs'
import { CATEGORY_LABELS } from '../src/domain/catalog.js'
import { todayKey, weekdayName, formatDay, rangeKeys } from '../src/domain/dates.js'
import { generatePlan } from '../src/domain/generatePlan.js'

const catalog = JSON.parse(
  readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'),
)
const videosById = new Map(catalog.videos.map((video) => [video.id, video]))
const seed = Number(process.argv[2] ?? 2026)

const examples = [
  { mood: 'stressed', energy: 'low', goal: 'stress', daysPerWeek: 3, sessionMinutes: 20, weeks: 1 },
  { mood: 'motivated', energy: 'high', goal: 'strength', daysPerWeek: 5, sessionMinutes: 30, weeks: 1 },
  { mood: 'tired', energy: 'low', goal: 'flexibility', daysPerWeek: 4, sessionMinutes: 10, weeks: 1 },
  { mood: 'okay', energy: 'medium', goal: 'fitness', daysPerWeek: 4, sessionMinutes: 45, weeks: 1 },
]

for (const answers of examples) {
  const plan = generatePlan(answers, catalog, { seed, today: todayKey() })
  const summary = Object.entries(answers).map(([k, v]) => `${k}=${v}`).join(' ')
  console.log(`\n${summary}`)
  for (const date of rangeKeys(plan.startDate, plan.endDate)) {
    const day = `${weekdayName(date)} ${formatDay(date)}`.padEnd(11)
    const session = plan.sessions.find((s) => s.date === date)
    if (!session) {
      console.log(`  ${day} Rest`)
      continue
    }
    const videos = session.videoIds.map((id) => videosById.get(id))
    const total = videos.reduce((sum, video) => sum + video.durationMin, 0)
    console.log(`  ${day} ${CATEGORY_LABELS[session.category].padEnd(11)} ${String(total).padStart(2)} min`)
    for (const video of videos) {
      console.log(`  ${''.padEnd(11)}   · ${video.title} (${video.channel}, ${video.durationMin} min, ${video.intensity})`)
    }
  }
}
