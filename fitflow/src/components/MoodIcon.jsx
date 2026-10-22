// Simple faces for the three check-in moods (spec 003). Decorative: the
// surrounding text or aria-label always names the mood.
const MOUTHS = {
  low: 'M8.5 16.5c1-1.4 2.2-2 3.5-2s2.5.6 3.5 2',
  okay: 'M8.5 15.5h7',
  ready: 'M8 14.5c1 1.8 2.4 2.7 4 2.7s3-.9 4-2.7',
}

function MoodIcon({ mood, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9 9.5v.5M15 9.5v.5" />
      <path d={MOUTHS[mood]} />
    </svg>
  )
}

export default MoodIcon
