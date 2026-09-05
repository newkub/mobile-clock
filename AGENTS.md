---
name: wrikka-mobile
description: Personal customizable Android/PWA app with Clock, Tasks, Devin, Notes, Saved, Email tabs and Cloudflare Workers + D1 sync
---

## Goal

Ship `wrikka-mobile` ให้ทำงานบน Android (Capacitor 8) และ PWA บน Cloudflare Workers โดยมี Home เป็นหน้าแรก พร้อม tabs ปรับแต่งได้ ตั้งค่าได้ และ UX ที่ใช้งานง่าย

## Scope

- Web app: React 19 + Vite 8 + TypeScript 5 + Tailwind CSS v4
- Mobile wrapper: Capacitor 8 (Android only)
- Storage: Capacitor Preferences + Zustand persist
- Sync: Cloudflare Workers + D1 สำหรับ alarms/reminders
- Notifications: Capacitor Local Notifications + PWA service worker
- AI sound: ElevenLabs API (TTS)
- Widget: Android home screen clock widget
- Deploy: Cloudflare Workers + Wrangler
- Play Store: release AAB signed and upload-ready
- Review: /review-codebase

## Execute

```bash
# dev
bun dev

# worker dev (run in another terminal)
bun dev:worker

# build web
bun build

# typecheck
bun typecheck

# test
bun run test

# add Android platform (requires Android SDK)
bun cap add android

# sync web assets to Android
bun cap:sync

# open Android Studio
bun cap:open

# deploy to Cloudflare Workers
bun run deploy

# create D1 database
bunx wrangler d1 create wrikka-mobile-db

# build release AAB
cd android
./gradlew bundleRelease
```

## Rules

- ใช้ React hooks และ Zustand สำหรับ state
- ห้าม hardcode secrets ใน source
- TypeScript strict mode
- ทุก async external call (Capacitor, ElevenLabs, Worker) ต้องมี try/catch
- ทุก component/tab ควรยาวไม่เกิน 250 บรรทัด
- PWA manifest และ service worker ต้องครบถ้วน
- Android project ใช้ `server.cleartext` disabled สำหรับ production
- ข้อมูล alarm/reminder sync ผ่าน `/api/alarms` และ `/api/reminders` บน Worker
- ข้อมูล sensitive ทั้งหมด (ElevenLabs key, user id) เก็บบนอุปกรณ์ผ่าน Preferences / localStorage
- แต่ละ tab ควรมี settings ของตัวเอง บวก global settings

## Architecture

- `src/main.tsx` — entry, init Capacitor plugins
- `src/App.tsx` — home, tab router, settings modal, onboarding
- `src/components/` — reusable UI (Button, Input, Switch, TimePicker, CircleProgress, TabBar, Header, StatusToast)
- `src/tabs/` — Home, Clock, Task, Devin, Notes, Saved, Email, Agent
- `src/tabs/clock-sub/` — Alarm, Stopwatch, Timer, Pomodoro, Reminder
- `src/lib/` — Capacitor wrapper, storage, audio, ElevenLabs, notifications, sync API, status
- `src/store/app.ts` — Zustand state persisted locally
- `worker/index.ts` — Cloudflare Worker entry with static assets
- `worker/api/alarms.ts` — sync alarms
- `worker/api/reminders.ts` — sync reminders
- `worker/api/status.ts` — GitHub/Cloudflare status
- `worker/api/ai-fix.ts` — error → fix suggestion
- `wrangler.toml` — Workers + D1 + static assets config

## Expected Outcome

- `bun build` passes
- `bun run test` passes
- PWA deploys to Cloudflare Workers
- D1 sync endpoint พร้อมใช้
- Android project structure is ready for `cap add android` once Android SDK is installed
