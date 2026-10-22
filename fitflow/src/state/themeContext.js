import { createContext, useContext } from 'react'

export const ThemeContext = createContext(null)

// Returns { theme: 'dark' | 'light', toggleTheme }.
export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}
