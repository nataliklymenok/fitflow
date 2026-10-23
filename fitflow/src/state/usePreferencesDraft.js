import { useState } from 'react'
import { trainers } from '../data/trainers.js'
import { videos } from '../data/videos.js'
import { CATEGORIES } from '../domain/catalog.js'
import { MAX_TRAINERS, validatePreferences } from '../domain/preferences.js'

const sorted = (list) => [...list].sort()

export function samePreferences(a, b) {
  return (
    JSON.stringify(sorted(a.trainers)) === JSON.stringify(sorted(b.trainers)) &&
    JSON.stringify(sorted(a.categories)) === JSON.stringify(sorted(b.categories))
  )
}

// An editable copy of the user's choice, with the rules from spec 004:
// at most 5 trainers, at least one workout type, something left to use.
export function usePreferencesDraft(initial) {
  const [value, setValue] = useState(initial)
  const [notice, setNotice] = useState('')

  function toggleTrainer(id) {
    if (value.trainers.includes(id)) {
      setValue({ ...value, trainers: value.trainers.filter((t) => t !== id) })
      setNotice('')
    } else if (value.trainers.length >= MAX_TRAINERS) {
      setNotice(`You can choose up to ${MAX_TRAINERS} trainers. Unselect one first.`)
    } else {
      setValue({ ...value, trainers: [...value.trainers, id] })
      setNotice('')
    }
  }

  function toggleCategory(category) {
    if (value.categories.includes(category)) {
      if (value.categories.length === 1) {
        setNotice('Keep at least one workout type switched on.')
        return
      }
      setValue({ ...value, categories: value.categories.filter((c) => c !== category) })
    } else {
      const next = [...value.categories, category]
      setValue({ ...value, categories: CATEGORIES.filter((c) => next.includes(c)) })
    }
    setNotice('')
  }

  function clearTrainers() {
    setValue({ ...value, trainers: [] })
    setNotice('')
  }

  const errors = validatePreferences(value, videos, trainers)
  return { value, notice, errors, toggleTrainer, toggleCategory, clearTrainers }
}
