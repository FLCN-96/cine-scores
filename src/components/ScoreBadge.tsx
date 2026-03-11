interface Props {
  score: number | null
  size?: 'sm' | 'md'
}

export function ScoreBadge({ score, size = 'md' }: Props) {
  const cls =
    score === null
      ? 'score-badge--none'
      : score >= 7.5
        ? 'score-badge--high'
        : score >= 5
          ? 'score-badge--mid'
          : 'score-badge--low'

  return (
    <div className={`score-badge ${cls}`} style={size === 'sm' ? { width: 36, height: 36, fontSize: 13 } : {}}>
      {score !== null ? score : '—'}
    </div>
  )
}
