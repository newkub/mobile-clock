import { createSignal, For, Show } from "solid-js";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { haptic } from "../../lib/capacitor";
import { showStatus } from "../../lib/status";
import { appStore } from "../../store/app";
import { addNote, removeNote, updateNote } from "../../store/actions";

export function NotesTab() {
  const [draft, setDraft] = createSignal("");
  const [editingId, setEditingId] = createSignal<string | null>(null);

  function add() {
    const text = draft().trim();
    if (!text) return;
    setDraft("");
    haptic("medium");
    addNote(text);
    showStatus("Note added", "success");
  }

  function saveEdit(id: string, text: string) {
    if (!text.trim()) return;
    setEditingId(null);
    updateNote(id, text);
  }

  return (
    <div class="tab-content h-full overflow-y-auto p-5 pb-28 md:pb-8">
      <div class="mx-auto max-w-4xl space-y-5">
        <h2 class="flex items-center gap-2 text-2xl font-bold text-text">
          <span class="i-mdi-note-text-outline h-6 w-6 text-primary" /> Quick Notes
        </h2>

        <div class="rounded-2xl bg-surface-2 p-4">
          <div class="flex gap-2">
            <input
              type="text"
              value={draft()}
              onInput={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Write a quick note..."
              class="flex-1 rounded-xl border border-border bg-surface-3 px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="New note"
            />
            <Button onClick={add} variant="primary" class="h-12 w-12 shrink-0 rounded-xl p-0" aria-label="Add note">
              <span class="i-mdi-plus h-5 w-5" />
            </Button>
          </div>
        </div>

        <Show
          when={appStore.notes.length > 0}
          fallback={
            <EmptyState
              icon="i-mdi-note-text-outline"
              title="No notes yet"
              subtitle="Capture thoughts during focus sessions."
            />
          }
        >
          <div class="space-y-2">
            <For each={appStore.notes.slice().reverse()}>
              {(note) => {
                const isEditing = () => editingId() === note.id;
                return (
                  <div class="rounded-2xl border border-border bg-surface-2 p-4">
                    <Show
                      when={isEditing()}
                      fallback={
                        <p
                          class="cursor-text text-sm text-text"
                          onDblClick={() => setEditingId(note.id)}
                        >
                          {note.text}
                        </p>
                      }
                    >
                      <textarea
                        value={note.text}
                        onBlur={(e) => saveEdit(note.id, e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            saveEdit(note.id, e.currentTarget.value);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        class="w-full resize-none rounded-lg border border-primary bg-surface-3 px-3 py-2 text-sm text-text outline-none"
                        rows={3}
                        autofocus
                      />
                    </Show>
                    <div class="mt-2 flex items-center justify-between text-xs text-text-secondary">
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                      <div class="flex gap-1">
                        <button
                          onClick={() => setEditingId(note.id)}
                          class="rounded-lg p-1.5 transition hover:bg-surface-3"
                          aria-label="Edit note"
                        >
                          <span class="i-mdi-pencil h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { haptic("light"); removeNote(note.id); showStatus("Note deleted", "info"); }}
                          class="rounded-lg p-1.5 transition hover:bg-danger/10 hover:text-danger"
                          aria-label="Delete note"
                        >
                          <span class="i-mdi-delete h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
