import { copyFile, readdir, unlink } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const files = await readdir(dist);
const shards = files.filter((name) => /^sitemap-\d+\.xml$/.test(name));

if (shards.length !== 1) {
  throw new Error(`Expected one sitemap shard, found ${shards.length}. Update the release sitemap before publishing.`);
}

await copyFile(new URL(shards[0], dist), new URL('sitemap.xml', dist));
await Promise.all([
  unlink(new URL(shards[0], dist)),
  unlink(new URL('sitemap-index.xml', dist)),
]);

console.log('Created dist/sitemap.xml');
