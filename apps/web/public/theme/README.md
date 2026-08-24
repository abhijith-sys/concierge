# App theme

Replace files in this folder to rebrand the app. Restart the dev server (or rebuild) so every screen picks up the change.

| File | What it controls |
|---|---|
| `theme.json` | App name, tagline, description, legal name, favicon/logo/banner paths |
| `tokens.css` | Background, text, navy, gold, and font families |
| `favicon.svg` | Browser tab icon |
| `logo-mark.svg` | Small mark in the header |
| `logo.svg` | Full logo (used when `logoIncludesWordmark` is `true`) |
| `banner.svg` | Listings fallback and auth panel background |
| `backdrop.json` | Home hero Lottie animation behind the category tiles |
| `animated/empty-list.json` | Shared empty-list Lottie (astronaut) |

PNG or JPG is fine — drop the file here and update the matching path in `theme.json`.

Email copy in the API uses `apps/api/src/shared/brand.ts`. Keep that name in sync with `theme.json`.
