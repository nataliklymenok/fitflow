import { Link, NavLink } from 'react-router'
import { usePlan } from '../state/planContext.js'
import BottomTabBar from './BottomTabBar.jsx'
import styles from './Layout.module.css'
import ThemeToggle from './ThemeToggle.jsx'

// Main sections, shared by the header nav (desktop) and the tab bar (phones).
const SECTIONS = [
  { to: '/today', label: 'Today', icon: 'bolt', needsPlan: true },
  { to: '/calendar', label: 'Calendar', icon: 'calendar', needsPlan: true },
  { to: '/trainers', label: 'Trainers', icon: 'people', needsPlan: false },
]

function Layout({ children }) {
  const { state } = usePlan()
  const hasPlan = Boolean(state.plan)

  return (
    <div className={`${styles.page} ${hasPlan ? styles.withTabBar : ''}`}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo} aria-label="FitFlow home">
            Fit<span className={styles.logoAccent}>Flow</span>
          </Link>
          <div className={styles.headerEnd}>
            <nav aria-label="Main" className={styles.nav}>
              {SECTIONS.filter((s) => hasPlan || !s.needsPlan).map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.inner}>{children}</div>
      </main>
      {hasPlan && <BottomTabBar sections={SECTIONS} />}
    </div>
  )
}

export default Layout
