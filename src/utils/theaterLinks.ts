import { THEATER } from '../config/theater'

/** Cinemark theater page (primary destination) */
export function getTheaterUrl(): string {
  return THEATER.url
}

/** Fandango theater page, optionally filtered to a date */
export function getShowtimesUrl(date?: string | null): string {
  if (date) {
    return `${THEATER.fandango.url}?date=${date}`
  }
  return THEATER.fandango.url
}

/** Cinemark search for a specific movie title */
export function getMovieSearchUrl(title: string): string {
  return `https://www.cinemark.com/search?query=${encodeURIComponent(title)}`
}
