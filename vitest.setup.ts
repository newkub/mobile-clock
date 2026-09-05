class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }
}

const storage = new MemoryStorage();

(globalThis as any).localStorage = storage;
if (typeof window !== "undefined") {
  (window as any).localStorage = storage;
}
