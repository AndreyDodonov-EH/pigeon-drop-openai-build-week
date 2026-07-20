import { copyFile, mkdir } from 'node:fs/promises';

await Promise.all([
  mkdir('dist/server', { recursive: true }),
  mkdir('dist/.openai', { recursive: true }),
]);

await Promise.all([
  copyFile('sites/worker.js', 'dist/server/index.js'),
  copyFile('.openai/hosting.json', 'dist/.openai/hosting.json'),
]);
