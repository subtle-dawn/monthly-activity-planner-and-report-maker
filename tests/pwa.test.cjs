const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));

test('manifest works under a GitHub Pages repository path and icons match declared sizes', () => {
  const base = 'https://example.github.io/monthly-activity/';
  for (const key of ['id', 'start_url', 'scope']) {
    assert.equal(new URL(manifest[key], base).href, base);
  }
  for (const icon of [...manifest.icons, { src: 'icons/apple-touch-icon.png', sizes: '180x180' }]) {
    const png = fs.readFileSync(path.join(root, icon.src));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  assert(manifest.icons.some(icon => icon.purpose === 'maskable'));
});

function worker() {
  const scope = 'https://example.github.io/monthly-activity/';
  const current = `monthly-activity:${scope}:v1`;
  const old = `monthly-activity:${scope}:old`;
  const other = 'monthly-activity:https://example.github.io/another-app/:v1';
  const stores = new Map([[old, new Map()], [other, new Map()]]);
  const events = {};
  let claimed = false;
  const context = {
    URL, Request,
    self: {
      registration: { scope },
      clients: { claim: async () => { claimed = true; } },
      addEventListener: (type, callback) => { events[type] = callback; }
    },
    caches: {
      open: async name => {
        if (!stores.has(name)) stores.set(name, new Map());
        const store = stores.get(name);
        return {
          addAll: async requests => {
            for (const request of requests) {
              const relative = new URL(request.url).pathname.slice('/monthly-activity/'.length);
              assert(fs.existsSync(path.join(root, relative || 'index.html')), relative);
              store.set(request.url, { cached: request.url });
            }
          },
          match: async url => store.get(url)
        };
      },
      keys: async () => [...stores.keys()],
      delete: async name => stores.delete(name)
    },
    fetch: async () => { throw new Error('offline'); }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
  return { events, stores, current, old, other, claimed: () => claimed, scope };
}

test('precache supports offline navigation/assets and only removes this app’s old caches', async () => {
  const w = worker();
  let pending;
  w.events.install({ waitUntil: promise => { pending = promise; } });
  await pending;
  w.events.activate({ waitUntil: promise => { pending = promise; } });
  await pending;
  assert(w.stores.has(w.current));
  assert(!w.stores.has(w.old));
  assert(w.stores.has(w.other));
  assert(w.claimed());
  for (const file of ['', 'index.html', 'app.js', 'style.css', 'manifest.webmanifest', 'icons/icon-192.png']) {
    let response;
    w.events.fetch({ request: { method: 'GET', url: w.scope + file + '?from=home' }, respondWith: p => { response = p; } });
    assert.equal((await response).cached, w.scope + file);
  }
  for (const [method, url] of [['POST', w.scope], ['GET', 'https://fonts.googleapis.com/css2'], ['GET', 'https://example.github.io/another-app/'], ['GET', w.scope + 'personal.json']]) {
    w.events.fetch({ request: { method, url }, respondWith: () => assert.fail('Unrelated requests should not be intercepted') });
  }
});
