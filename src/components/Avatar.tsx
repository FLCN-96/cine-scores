import type { User } from '../types'

interface Props {
  user: User
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { width: 28, height: 28, fontSize: 11 },
  md: { width: 36, height: 36, fontSize: 14 },
  lg: { width: 52, height: 52, fontSize: 20 },
}

export function Avatar({ user, size = 'md' }: Props) {
  const dims = SIZES[size]
  return (
    <div
      className="avatar"
      style={{ ...dims, background: user.color }}
      title={user.name}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  )
}
