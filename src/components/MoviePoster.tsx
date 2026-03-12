interface Props {
  posterUrl: string
  title: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { width: 44, height: 66 },
  md: { width: 60, height: 90 },
  lg: { width: 100, height: 150 },
}

export function MoviePoster({ posterUrl, title, size = 'md' }: Props) {
  const dims = SIZES[size]
  return (
    <div
      className="movie-poster"
      style={{ width: dims.width, height: dims.height, fontSize: size === 'lg' ? 40 : 28 }}
    >
      {posterUrl ? (
        <img src={posterUrl} alt={title} />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: '55%', height: '55%', opacity: 0.3 }}>
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
      )}
    </div>
  )
}
