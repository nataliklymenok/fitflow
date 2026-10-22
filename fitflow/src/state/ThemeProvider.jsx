import { useCallback, useMemo, useState } from 'react'
import { saveTheme } from '../domain/storage.js'
import { ThemeContext } from './themeContext.js'

const THEME_COLORS = { dark: '#0c0e0d', light: '#f6f5fb' }

// index.html has already put the starting theme on <html>; start from it.
function initialTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[theme])
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  // Only an explicit choice is saved; until then the device setting applies.
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    saveTheme(next)
    setTheme(next)
    // Cross-fade the whole page where the browser supports it and motion is
    // allowed (spec 002, US-5); otherwise switch at once.
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (document.startViewTransition && !reduceMotion) {
      document.startViewTransition(() => applyTheme(next))
    } else {
      applyTheme(next)
    }
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
