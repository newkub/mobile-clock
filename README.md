# mobile-clock

A local-first clock app for Android and PWA — built with SolidJS, Vite, UnoCSS, Capacitor, and Cloudflare Workers.

## Features

| Feature | Description |
|---|---|
| Clock | Analog + digital clock, live timezone, GMT offset, and world clocks |
| Alarm | One-time or repeating alarms with local notifications and optional AI voice (ElevenLabs) |
| Stopwatch | Persistent stopwatch with laps and keyboard shortcuts |
| Timer | Preset countdowns with colors and persistent state across tab switch / reload |
| Pomodoro | Focus / short break / long break timer with configurable durations and session stats |
| Reminders | Date + time reminders with daily/weekly/monthly repeat |
| World Clock | Add and track multiple timezones on the Clock tab |
| Search & Filter | Quickly find alarms and reminders |
| Sound Themes | Choose between beep, chime, digital, and soft alert sounds |
| 12h / 24h | Global time format toggle |
| Onboarding | First-run guide for new users |
| Data Backup | Export / import local data as JSON |
| PWA Install | Add-to-home-screen prompt when the browser supports it |
| Responsive | Bottom tab bar on mobile, top navigation on tablet/desktop |
| Stats | GitHub-like activity heatmap for Pomodoro focus time |
| Ambient Sounds | Brown/pink/rain/cafe noise with volume and sleep timer |
| Breathing | Box and 4-7-8 breathing exercises with visual guide |

## Stack

- SolidJS 1.9 + Vite 8 + TypeScript 5 (strict)
- UnoCSS (presetWind4 + MDI icons)
- Capacitor 8 (Android)
- Cloudflare Workers static assets

## Scripts

```bash
bun install
bun run dev          # Vite dev server
bun run typecheck    # TypeScript check
bun run test         # Vitest unit tests
bun run build        # Production web build (tsc + vite build)
bun run deploy       # Deploy PWA to Cloudflare Workers
bun run cap:sync     # Copy web assets to Android
bun run cap:open     # Open Android Studio (requires Android SDK)
```

## Ship

1. `bun run build`
2. `bun run deploy` — deploys `dist/` to Cloudflare Workers
3. For Android: `bun run cap:sync` then build release AAB/APK in Android Studio

## License

See [LICENSE](./LICENSE).
