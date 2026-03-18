/**
 * Replaces Unicode typographic characters that fall outside Latin-1 (>U+00FF)
 * with their nearest ASCII equivalents. This prevents btoa() failures when
 * encoding text sourced from external APIs such as TMDB.
 *
 * Apply at the ingestion boundary — the moment data from an external source
 * is written into React state or the Zustand store. See STYLE_GUIDE.md.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/[\u201C\u201D]/g, '"')  // " "  curly double quotes → "
    .replace(/[\u2018\u2019]/g, "'")  // ' '  curly single quotes → '
    .replace(/\u2013/g, '-')          // –    en dash             → -
    .replace(/\u2014/g, ' - ')        // —    em dash             → ' - '
    .replace(/\u2026/g, '...')        // …    ellipsis            → ...
    .replace(/\u00A0/g, ' ')          // NBSP non-breaking space  → space
}
