import styles from './Layout.module.css'

function Layout({ children }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <span className={styles.logo}>FitFlow</span>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.inner}>{children}</div>
      </main>
    </div>
  )
}

export default Layout
