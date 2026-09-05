---
name: mobile-clock
description: Local-first Android/PWA clock app — Clock, Alarm, Stopwatch, Timer, Pomodoro, Reminder — SolidJS + Capacitor 8 + Cloudflare Workers static assets
---

## Goal

Ship `mobile-clock` ให้ทำงานบน Android (Capacitor 8) และ PWA บน Cloudflare Workers โดย local-first (ไม่ต้องมี backend sync) พร้อม UX ที่ใช้งานง่ายบน mobile/tablet/desktop

## Scope

- Web app: SolidJS 1.9 + Vite 8 + TypeScript 5 (strict) + UnoCSS (presetWind4 + presetIcons/MDI)
- Mobile wrapper: Capacitor 8 (Android only)
- Storage: Solid `createStore` persisted ผ่าน localStorage (`wrikka-clock-store`) + localStorage keys สำหรับ running timers
- Notifications: Capacitor Local Notifications (native) + web alarm watcher + in-app ringing overlay + service worker
- AI sound: ElevenLabs API (TTS) ผ่าน settings
- Deploy: Cloudflare Workers static assets + Wrangler (SPA `not_found_handling`)
- Review: /review-codebase

## Execute

```bash
# dev
bun dev

# build web (tsc -b && vite build)
bun build

# typecheck
bun typecheck

# test (vitest)
bun run test

# add Android platform (requires Android SDK)
bun cap:add:android

# sync web assets to Android
bun cap:sync

# open Android Studio
bun cap:open

# deploy to Cloudflare Workers
bun run deploy
```

## Rules

- ใช้ Solid signals + `createStore`/`setStore` สำหรับ state — ห้ามพึ่ง React patterns
- ห้าม hardcode secrets ใน source (ElevenLabs key เก็บใน store/localStorage)
- TypeScript strict mode
- ทุก async external call (Capacitor, notifications, Worker, ElevenLabs) ต้องมี try/catch
- ทุก component/tab ควรยาวไม่เกิน 250 บรรทัด
- Timer/Stopwatch/Pomodoro ต้องใช้ module-scoped state + wall-clock (`endsAt`) และ persist ลง localStorage — ห้าม reset เมื่อสลับ tab หรือ reload
- Modal ทั้งหมดใช้ shared `components/Modal.tsx` (backdrop + Escape close)
- Responsive: `<md` ใช้ bottom `TabBar`, `md+` ใช้ top nav ใน `Header` + content container `max-w-*` กึ่งกลาง
- PWA manifest และ service worker ต้องครบถ้วน
- Android project ใช้ `server.cleartext` disabled สำหรับ production

## Architecture

- `src/main.tsx` — entry, init Capacitor plugins, notification permission, service worker
- `src/App.tsx` — root layout, sub-tab router (`Switch`/`Match`), swipe + keyboard nav, alarm watcher, ringing overlay
- `src/store/app.ts` — `createStore` + initial state + localStorage hydrate/persist
- `src/store/actions.ts` — state mutation helpers (alarms, presets, reminders, pomodoro sessions, settings)
- `src/types.ts` — `Alarm`, `Reminder`, `TimerPreset`, `PomodoroSession`, tab types
- `src/components/` — Button, Input, Switch, Modal, TimePicker, CircleProgress, EmptyState, StatusToast, Header (+ top nav), TabBar, AnalogClock, AlarmRingOverlay, `nav-meta.ts` (shared sub-tab metadata)
- `src/hooks/` — `use-interval`, `use-media-query`, `use-shortcuts`
- `src/tabs/clock-sub/` — Clock, Alarm, Stopwatch, Timer, Pomodoro, Reminder (+ `alarm/`, `reminder/` subdirs)
- `src/lib/` — capacitor, status, audio, elevenlabs, notifications, time, hash
- `worker/index.ts` — Cloudflare Worker entry (static assets only)
- `wrangler.jsonc` — Workers + static assets config

## Expected Outcome

- `bun typecheck` ผ่าน
- `bun build` ผ่าน
- `bun run test` ผ่าน
- PWA deploys to Cloudflare Workers
- Timers ไม่หายเมื่อสลับ tab หรือ reload
- Android project structure พร้อม `bun cap:add:android` เมื่อมี Android SDK
