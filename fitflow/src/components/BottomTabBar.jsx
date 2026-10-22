import { NavLink } from 'react-router'
import styles from './BottomTabBar.module.css'

const ICONS = {
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
}

// Main sections within thumb reach on phones (spec 002, US-2). Hidden by CSS
// on wider screens, where the header nav shows the same links.
function BottomTabBar({ sections }) {
  return (
    <nav aria-label="Main" className={styles.bar}>
      {sections.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[icon]}
          </svg>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomTabBar
