import { Link } from 'react-router'
import { usePlan } from '../state/planContext.js'
import styles from './Layout.module.css'
import ThemeToggle from './ThemeToggle.jsx'

function Layout({ children }) {
  const { state } = usePlan()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            FitFlow
          </Link>
          <div className={styles.headerEnd}>
            {state.plan && (
              <nav aria-label="Main">
                <Link to="/calendar" className={styles.navLink}>
                  My plan
                </Link>
              </nav>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.inner}>{children}</div>
      </main>
    </div>
  )
}

export default Layout
