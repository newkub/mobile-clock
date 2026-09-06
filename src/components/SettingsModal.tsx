import { createSignal, For } from "solid-js";
import { appStore, setGlobalSetting, setElevenLabsKey } from "../store/app";
import { showStatus } from "../lib/status";
import { haptic } from "../lib/capacitor";
import { requestNotificationPermission } from "../lib/notifications";
import { Button } from "./Button";
import { Input } from "./Input";
import { Switch } from "./Switch";
import { Modal } from "./Modal";
import { SettingsDataSection } from "./SettingsDataSection";

export function SettingsModal(props: { onClose: () => void }) {
	const [key, setKey] = createSignal(appStore.elevenLabsKey);

	function setTheme(theme: "dark" | "light") {
		setGlobalSetting("theme", theme);
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
							<For each={["dark", "light"] as const}>
								{(t) => (
									<button
										onClick={() => setTheme(t)}
										class={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold capitalize transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
											appStore.globalSettings.theme === t
												? "border-primary bg-primary/10 text-primary"
												: "border-border bg-surface-2 text-text-secondary"
										}`}
										aria-label={`Use ${t} theme`}
									>
										<span class={`${t === "dark" ? "i-mdi-weather-night" : "i-mdi-white-balance-sunny"} h-4 w-4`} />
										{t}
									</button>
								)}
							</For>
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
