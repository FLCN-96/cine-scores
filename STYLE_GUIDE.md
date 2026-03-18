# Cine-Scores Style Guide

## External API Text: Always Sanitize at the Boundary

### The Rule

Any string value that originates from an external API (TMDB, or any future source)
**must** be passed through `sanitizeText()` from `src/utils/sanitizeText.ts` before
being stored in application state or persisted to localStorage.

### Why

The TMDB API (and similar entertainment data APIs) regularly returns typographic
Unicode characters in free-form text fields: curly quotes (`\u201C`, `\u201D`,
`\u2018`, `\u2019`), en/em dashes (`\u2013`, `\u2014`), ellipsis (`\u2026`), and
non-breaking spaces (`\u00A0`). Characters above U+00FF cause the native browser
`btoa()` function to throw **"The string contains invalid characters"**, which
breaks the GitHub sync feature entirely.

**Real example that triggered this rule:**

Movie "Billie Eilish - Hit Me Hard and Soft: The Tour (Live in 3D)" was added via
TMDB search. Its description contained:

> Described as \u201Can innovative new concert experience\u201D, as it charts
> Billie Eilish\u2019 Hit Me Hard and Soft tour.

The three Unicode characters (`\u201C`, `\u201D`, `\u2019`) caused every subsequent
sync attempt to fail with an unhandled exception. No other movies could be synced
until the data was repaired.

### Where to Apply It

Apply `sanitizeText()` at the **ingestion boundary** — the moment data from an
external source is written into React state. Do not rely on sanitization happening
later in the pipeline.

**Current ingestion point (`src/components/AddMovieSheet.tsx`):**

```typescript
function selectSuggestion(result: TmdbResult) {
  setTitle(sanitizeText(result.title))
  setDescription(sanitizeText(result.overview ?? ''))
  // ...
}
```

If new TMDB fields are added in the future (tagline, cast names, etc.), apply
`sanitizeText()` to each free-form string field at the same point.

### The Utility

```typescript
import { sanitizeText } from '../utils/sanitizeText'
```

The function is idempotent: running it on already-clean ASCII text is a no-op.
It maps the most common offenders to readable ASCII equivalents:

| Unicode | Name | Replaced with |
|---------|------|---------------|
| `\u201C` `\u201D` | Curly double quotes | `"` |
| `\u2018` `\u2019` | Curly single quotes / apostrophe | `'` |
| `\u2013` | En dash | `-` |
| `\u2014` | Em dash | ` - ` |
| `\u2026` | Ellipsis | `...` |
| `\u00A0` | Non-breaking space | ` ` (regular space) |

### Defense-in-Depth: UTF-8 Safe Base64

`src/hooks/useSync.ts` uses `toBase64()` / `fromBase64()` helpers built on
`TextEncoder` / `TextDecoder` instead of raw `btoa()` / `atob()`. This means a
Unicode character that somehow bypasses `sanitizeText()` will not crash the sync
encoder — it will round-trip safely. However, **this is not a substitute** for
sanitizing at ingestion; non-ASCII characters in stored data can still cause
issues in other contexts (CSV export, log output, third-party integrations).

### Migration Hygiene

`migrateMovie()` in `src/store/index.ts` sanitizes `title` and `description` on
every app hydration. This pattern — applying sanitization during schema migration —
**must be continued** whenever a new version of the `Movie` type is introduced.
Add a sanitization pass for any new free-form string field in that function.
