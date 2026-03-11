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
        '🎬'
      )}
    </div>
  )
}
