import { useMemo } from 'react'
import { videos } from '../data/videos.js'
import { CATEGORIES } from '../domain/catalog.js'
import {
  DEFAULT_PREFERENCES,
  allowedVideos,
  availableCategories,
} from '../domain/preferences.js'
import { usePlan } from './planContext.js'

// The videos and workout types the user's choice of trainers and types allows
// (spec 004, US-3). Everything that picks videos uses these.
export function useAllowedVideos() {
  const { state } = usePlan()
  const preferences = state.preferences ?? DEFAULT_PREFERENCES
  return useMemo(() => {
    const allowed = allowedVideos(videos, preferences)
    const categories = availableCategories(videos, preferences)
    return { videos: allowed, categories: categories.length > 0 ? categories : CATEGORIES }
  }, [preferences])
}
