// CSS custom properties that point a component at one category's colors.
// Components then use var(--cat), var(--cat-soft), var(--cat-solid) and
// var(--cat-on-solid), whatever the category and theme.
export function categoryVars(category) {
  return {
    '--cat': `var(--cat-${category})`,
    '--cat-soft': `var(--cat-${category}-soft)`,
    '--cat-solid': `var(--cat-${category}-solid)`,
    '--cat-on-solid': `var(--cat-${category}-on-solid)`,
  }
}
