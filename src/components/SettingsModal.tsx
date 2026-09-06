import { createSignal, For, Show } from "solid-js";
import { appStore, setGlobalSetting, setElevenLabsKey, setTabOrder, toggleTabHidden, initialState } from "../store/app";
import { subTabMeta } from "./nav-meta";
import { showStatus } from "../lib/status";
import { haptic } from "../lib/capacitor";
import { syncTheme } from "../lib/theme";
import { syncing, lastSyncedAt, syncFailed, syncNow } from "../lib/sync";
import { requestNotificationPermission } from "../lib/notifications";
import { playFinishAlert } from "../lib/audio";
import { Button } from "./Button";
import { Input } from "./Input";
import { Switch } from "./Switch";
import { Modal } from "./Modal";
import { SettingsDataSection } from "./SettingsDataSection";

export function SettingsModal(props: { onClose: () => void }) {
	const [key, setKey] = createSignal(appStore.elevenLabsKey);

	function setTheme(theme: "dark" | "light" | "auto") {
		setGlobalSetting("theme", theme);
		syncTheme();
		haptic("light");
	}

	function saveKey() {
		setElevenLabsKey(key().trim());
		showStatus("ElevenLabs key saved", "success");
	}

	async function enableNotifications() {
		setGlobalSetting("notifications", true);
		const granted = await requestNotificationPermission();
		showStatus(
			granted ? "Notifications enabled" : "Permission denied by system",
			granted ? "success" : "warning",
		);
	}

	function setTimeFormat(format: "12h" | "24h") {
		setGlobalSetting("timeFormat", format);
		haptic("light");
	}

	function setSoundTheme(theme: "beep" | "chime" | "digital" | "soft") {
		setGlobalSetting("soundTheme", theme);
		if (appStore.globalSettings.sound) playFinishAlert("timer");
		haptic("light");
	}

	return (
		<Modal onClose={props.onClose} panelClass="flex max-h-[85vh] flex-col" aria-label="Settings">
				<div class="mb-5 flex items-center justify-between">
					<h2 class="flex items-center gap-2 text-xl font-bold text-text">
						<span class="i-mdi-cog h-6 w-6 text-primary" /> Settings
					</h2>
					<button
						onClick={props.onClose}
						class="rounded-full p-2 text-text-secondary transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:text-text"
						aria-label="Close settings"
					>
						<span class="i-mdi-close h-5 w-5" />
					</button>
				</div>

				<div class="space-y-6 overflow-y-auto pr-1">
					{/* Theme */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-palette h-4 w-4" /> Theme
						</h3>
						<div class="flex gap-2">
							<For each={["dark", "light", "auto"] as const}>
								{(t) => {
									const icon =
										t === "dark"
											? "i-mdi-weather-night"
											: t === "light"
												? "i-mdi-white-balance-sunny"
												: "i-mdi-theme-light-dark";
									return (
										<button
											onClick={() => setTheme(t)}
											class={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold capitalize transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
												appStore.globalSettings.theme === t
													? "border-primary bg-primary/10 text-primary"
													: "border-border bg-surface-2 text-text-secondary"
											}`}
											aria-label={`Use ${t} theme`}
										>
											<span class={`${icon} h-4 w-4`} />
											{t}
										</button>
									);
								}}
							</For>
						</div>
					</section>

					{/* Appearance */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-brush-variant h-4 w-4" /> Appearance
						</h3>
						<div class="space-y-4 rounded-2xl bg-surface-2 p-4">
							<div>
								<label class="mb-1 block text-sm font-medium text-text">Accent color</label>
								<div class="flex items-center gap-3">
									<input
										type="color"
										value={appStore.globalSettings.accentColor}
										onInput={(e) => setGlobalSetting("accentColor", e.currentTarget.value)}
										class="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent"
										aria-label="Accent color"
									/>
									<div class="flex flex-wrap gap-1.5">
										<For each={["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899", "#f97316"]}>
											{(c) => (
												<button
													onClick={() => { setGlobalSetting("accentColor", c); haptic("light"); }}
													class={`h-7 w-7 rounded-full transition active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
														appStore.globalSettings.accentColor === c ? "ring-2 ring-text ring-offset-2 ring-offset-surface-2" : ""
													}`}
													style={{ background: c }}
													aria-label={`Accent color ${c}`}
												/>
											)}
										</For>
									</div>
									<p class="ml-auto text-xs text-text-secondary">{appStore.globalSettings.accentColor}</p>
								</div>
							</div>
							<div>
								<label class="mb-1 block text-sm font-medium text-text">Font size</label>
								<div class="flex items-center gap-3">
									<input
										type="range"
										min={14}
										max={20}
										step={1}
										value={appStore.globalSettings.fontSize}
										onInput={(e) => setGlobalSetting("fontSize", parseInt(e.currentTarget.value))}
										class="flex-1"
										aria-label="Font size"
									/>
									<p class="text-xs text-text-secondary">{appStore.globalSettings.fontSize}px</p>
								</div>
							</div>
						</div>
					</section>

					{/* Sound & feedback */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-volume-high h-4 w-4" /> Sound &amp; feedback
						</h3>
						<div class="space-y-3 rounded-2xl bg-surface-2 p-4">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-text">Timer sounds</p>
									<p class="text-xs text-text-secondary">Play a beep when timers finish</p>
								</div>
								<Switch
									checked={appStore.globalSettings.sound}
									onChange={(v) => setGlobalSetting("sound", v)}
									aria-label="Toggle timer sounds"
								/>
							</div>
							<div>
								<p class="text-sm font-medium text-text">Sound theme</p>
								<div class="mt-2 grid grid-cols-2 gap-2">
									<For each={["beep", "chime", "digital", "soft"] as const}>
										{(t) => (
											<button
												onClick={() => setSoundTheme(t)}
												class={`rounded-xl py-2 text-sm font-medium capitalize transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
													appStore.globalSettings.soundTheme === t
														? "bg-primary text-white"
														: "bg-surface-3 text-text-secondary hover:text-text"
												}`}
												aria-label={`Use ${t} sound`}
											>
												{t}
											</button>
											)}
										</For>
									</div>
									<Button
										onClick={() => { haptic("light"); if (appStore.globalSettings.sound) playFinishAlert("timer"); else showStatus("Timer sounds are disabled", "info"); }}
										variant="secondary"
										size="sm"
										class="mt-2 w-full"
										aria-label="Test current sound theme"
									>
										<span class="i-mdi-volume-high mr-2 h-4 w-4" /> Test sound
									</Button>
								</div>
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-text">Haptics</p>
									<p class="text-xs text-text-secondary">Vibrate on taps and alerts</p>
								</div>
								<Switch
									checked={appStore.globalSettings.haptics}
									onChange={(v) => setGlobalSetting("haptics", v)}
									aria-label="Toggle haptics"
								/>
							</div>
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-text">Notifications</p>
									<p class="text-xs text-text-secondary">Alarm and reminder alerts</p>
								</div>
								<Switch
									checked={appStore.globalSettings.notifications}
									onChange={(v) => (v ? enableNotifications() : setGlobalSetting("notifications", false))}
									aria-label="Toggle notifications"
								/>
							</div>
						</div>
					</section>

					{/* Time format */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-clock-time-four-outline h-4 w-4" /> Time format
						</h3>
						<div class="flex gap-2 rounded-2xl bg-surface-2 p-1">
							<For each={["24h", "12h"] as const}>
								{(f) => (
									<button
										onClick={() => setTimeFormat(f)}
										class={`flex-1 rounded-xl py-2 text-sm font-medium transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
											appStore.globalSettings.timeFormat === f
												? "bg-primary text-white"
												: "bg-transparent text-text-secondary hover:text-text"
										}`}
										aria-label={`Use ${f} time`}
									>
										{f}
									</button>
								)}
							</For>
						</div>
					</section>

					{/* Pomodoro durations */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-brain h-4 w-4" /> Pomodoro
						</h3>
						<div class="grid grid-cols-3 gap-3 rounded-2xl bg-surface-2 p-4">
							<For
								each={
									[
										{ key: "pomodoroFocus", label: "Focus" },
										{ key: "pomodoroShort", label: "Short" },
										{ key: "pomodoroLong", label: "Long" },
									] as const
								}
							>
								{(f) => (
									<div>
										<label class="mb-1 block text-center text-xs text-text-secondary">{f.label} (min)</label>
										<input
											type="number"
											min={1}
											max={120}
											value={appStore.globalSettings[f.key]}
											onInput={(e) => {
												const v = Math.max(1, Math.min(120, parseInt(e.currentTarget.value) || 1));
												setGlobalSetting(f.key, v);
											}}
											class="w-full rounded-xl border border-border bg-surface-3 px-2 py-2 text-center text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
											aria-label={`${f.label} minutes`}
										/>
									</div>
								)}
							</For>
						</div>
					</section>

					{/* Wellness */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-eye h-4 w-4" /> Wellness
						</h3>
						<div class="space-y-3 rounded-2xl bg-surface-2 p-4">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-text">Eye break reminder</p>
									<p class="text-xs text-text-secondary">Notify every N minutes to rest your eyes</p>
								</div>
								<Switch
									checked={appStore.globalSettings.eyeBreakEnabled}
									onChange={(v) => setGlobalSetting("eyeBreakEnabled", v)}
									aria-label="Toggle eye break reminder"
								/>
							</div>
							<Show when={appStore.globalSettings.eyeBreakEnabled}>
								<div class="flex items-center gap-3">
									<label class="text-xs text-text-secondary">Interval (min)</label>
									<input
										type="number"
										min={5}
										max={120}
										value={appStore.globalSettings.eyeBreakInterval}
										onInput={(e) => setGlobalSetting("eyeBreakInterval", Math.max(5, Math.min(120, parseInt(e.currentTarget.value) || 20)))}
										class="w-20 rounded-xl border border-border bg-surface-3 px-2 py-2 text-center text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
										aria-label="Eye break interval"
									/>
								</div>
							</Show>
						</div>
					</section>

					{/* Layout */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-view-grid h-4 w-4" /> Layout
						</h3>
						<div class="space-y-2 rounded-2xl bg-surface-2 p-4">
							<p class="text-xs text-text-secondary">Reorder or hide navigation tabs. Changes apply immediately.</p>
							<div class="max-h-60 space-y-1 overflow-y-auto">
								<For each={appStore.tabOrder}>
									{(tab, index) => {
										const meta = subTabMeta[tab];
										const hidden = () => appStore.hiddenTabs.includes(tab);
										return (
											<div class={`flex items-center gap-2 rounded-xl border border-border bg-surface p-2 ${hidden() ? "opacity-50" : ""}`}>
												<span class={`${meta.icon} h-4 w-4 text-text-secondary`} />
												<span class="flex-1 text-sm text-text">{meta.label}</span>
												<button
													onClick={() => { toggleTabHidden(tab); haptic("light"); }}
													class="rounded-lg p-1.5 text-text-secondary transition hover:bg-surface-3"
													aria-label={hidden() ? `Show ${meta.label}` : `Hide ${meta.label}`}
												>
													<span class={`${hidden() ? "i-mdi-eye-off-outline" : "i-mdi-eye-outline"} h-4 w-4`} />
												</button>
												<button
													onClick={() => {
														const order = [...appStore.tabOrder];
														const [item] = order.splice(index(), 1);
														order.splice(index() - 1, 0, item);
														setTabOrder(order);
													}}
													disabled={index() === 0}
													class="rounded-lg p-1.5 text-text-secondary transition hover:bg-surface-3 disabled:opacity-30"
													aria-label="Move up"
												>
													<span class="i-mdi-chevron-up h-4 w-4" />
												</button>
												<button
													onClick={() => {
														const order = [...appStore.tabOrder];
														const [item] = order.splice(index(), 1);
														order.splice(index() + 1, 0, item);
														setTabOrder(order);
													}}
													disabled={index() === appStore.tabOrder.length - 1}
													class="rounded-lg p-1.5 text-text-secondary transition hover:bg-surface-3 disabled:opacity-30"
													aria-label="Move down"
												>
													<span class="i-mdi-chevron-down h-4 w-4" />
												</button>
											</div>
										);
									}}
								</For>
							</div>
							<Button
								onClick={() => { setTabOrder([...initialState.tabOrder]); haptic("light"); }}
								variant="secondary"
								size="sm"
								class="w-full"
								aria-label="Reset tab order"
							>
								Reset to default
							</Button>
						</div>
					</section>

					{/* Cloud sync */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-cloud-sync h-4 w-4" /> Cloud sync
						</h3>
						<div class="space-y-3 rounded-2xl bg-surface-2 p-4">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-text">Cross-device sync</p>
									<p class="text-xs text-text-secondary">
										{syncing()
											? "Syncing…"
											: syncFailed()
												? "Sync failed — will retry automatically"
												: lastSyncedAt()
													? `Last synced ${new Date(lastSyncedAt()!).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
													: "Not synced yet"}
									</p>
								</div>
								<span
									class={`h-2.5 w-2.5 rounded-full ${syncFailed() ? "bg-danger" : lastSyncedAt() ? "bg-success" : "bg-text-secondary/40"}`}
									aria-label={syncFailed() ? "Sync failed" : lastSyncedAt() ? "Synced" : "Not synced"}
								/>
							</div>
							<Button
								onClick={async () => { await syncNow(); showStatus(syncFailed() ? "Sync failed" : "Synced", syncFailed() ? "error" : "success"); }}
								variant="secondary"
								size="sm"
								class="w-full"
								aria-label="Sync now"
								disabled={syncing()}
							>
								<span class={`i-mdi-cloud-sync mr-2 h-4 w-4 ${syncing() ? "animate-spin" : ""}`} /> Sync now
							</Button>
						</div>
					</section>

					{/* AI alarm voice */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-sparkles h-4 w-4" /> AI alarm voice
						</h3>
						<div class="rounded-2xl bg-surface-2 p-4">
							<Input
								value={key()}
								onChange={setKey}
								placeholder="ElevenLabs API key (sk_...)"
								aria-label="ElevenLabs API key"
							/>
							<p class="mt-2 text-xs text-text-secondary">
								Stored locally. Used to generate AI voice alarm sounds.
							</p>
							<Button onClick={saveKey} size="sm" class="mt-3 w-full" aria-label="Save ElevenLabs key">
								<span class="i-mdi-content-save mr-2 h-4 w-4" /> Save key
							</Button>
						</div>
					</section>

					<SettingsDataSection />

					{/* About */}
					<section>
						<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
							<span class="i-mdi-information h-4 w-4" /> About
						</h3>
						<div class="rounded-2xl bg-surface-2 p-4 text-sm text-text-secondary">
							<p class="font-semibold text-text">Wrikka Clock</p>
							<p class="mt-1">Alarm, stopwatch, timer, pomodoro and reminders — all local on your device.</p>
							<p class="mt-2 text-xs">v0.0.1 · MIT License · Data never leaves this device.</p>
						</div>
					</section>
				</div>
		</Modal>
	);
}
