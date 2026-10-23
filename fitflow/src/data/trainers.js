import data from './trainers.json'

export const trainers = data.trainers

export const trainersById = new Map(trainers.map((trainer) => [trainer.id, trainer]))

export const LANGUAGE_LABELS = { en: 'English', uk: 'Ukrainian' }
