# mobile-clock

A clean, clock-only Android + PWA app built with SolidJS, Vite, UnoCSS, and Capacitor.

## Features

- Analog + digital clock (smooth second hand, timezone)
- Alarm with local notifications and optional ElevenLabs AI voice
- Stopwatch
- Timer with presets
- Pomodoro
- Reminders

## Scripts

`sh
bun install
bun run dev          # Vite dev server
bun run typecheck    # TypeScript check
bun run build:spa    # Production web build
bun run cap:sync     # Copy web assets to Android
bun cap:open         # Open Android Studio (requires Android SDK)
`

## Ship

1. un run build:spa
2. un run cap:sync
3. Open ndroid/ in Android Studio and build release AAB/APK.

## License

See [LICENSE](./LICENSE).
