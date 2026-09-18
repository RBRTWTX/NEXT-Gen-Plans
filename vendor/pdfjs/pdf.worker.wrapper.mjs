// NXT Gen Plans compatibility wrapper for the bundled PDF.js worker.
Promise.try ||= ((fn, ...args) => Promise.resolve().then(() => fn(...args)));
Uint8Array.prototype.toHex ||= function () { return Array.from(this, b => b.toString(16).padStart(2, '0')).join(''); };
Uint8Array.fromHex ||= function (hex) { const a = new Uint8Array(Math.floor(hex.length / 2)); for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16); return a; };
Map.prototype.getOrInsertComputed ||= function (key, fn) { if (this.has(key)) return this.get(key); const v = fn(key); this.set(key, v); return v; };
URL.parse ||= function (url, base) { try { return new URL(url, base); } catch { return null; } };
await import('./pdf.worker.mjs');
