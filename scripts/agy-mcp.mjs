#!/usr/bin/env node
// Minimal stdio MCP server exposing agy (cliproxyapi) for inspirational image
// generation and creative math/geometry brainstorming. Zero dependencies.
//
// Images land in images/inspiration/ and are REFERENCE ONLY — never ship them
// in the game. Provenance is appended to images/inspiration/LOG.md.

import { writeFileSync, appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = process.env.AGY_BASE_URL ?? 'http://127.0.0.1:8317';
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INSPIRATION_DIR = join(REPO_ROOT, 'images', 'inspiration');
const REQUEST_TIMEOUT_MS = 240_000;

const IMAGE_MODELS = ['gemini-3.1-flash-image', 'gpt-image-2', 'gpt-image-1.5'];
const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image';
const DEFAULT_ASK_MODEL = 'gemini-3.1-pro-low';

const TOOLS = [
  {
    name: 'generate_image',
    description:
      'Generate an inspirational/reference image via agy (cliproxyapi). ' +
      'Output is saved under images/inspiration/ and must NOT be used in the game directly — ' +
      'it is reference material for art direction only. If a result is liked, regenerate the ' +
      'shipping asset separately with the game-art workflow (consistent style, magenta chroma key, etc.). ' +
      'Returns the saved file path(s); use Read on the path to view the image.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Full art direction for the image.' },
        model: {
          type: 'string',
          enum: IMAGE_MODELS,
          description: `Image model. Default ${DEFAULT_IMAGE_MODEL}. gpt-image-* use the images API and accept "size".`,
        },
        name: {
          type: 'string',
          description: 'Short kebab-case slug for the output filename, e.g. "hydrant-splash-idea".',
        },
        size: {
          type: 'string',
          description: 'gpt-image-* only, e.g. "1024x1024", "1536x1024".',
        },
        reference_images: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional file paths of reference images to include (gemini model only).',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'ask',
    description:
      'Ask agy (cliproxyapi) a question — best for creative math/geometry (curves, easing, ' +
      'procedural shapes, physics tuning) or a second opinion / brainstorming. Returns text.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The question or brief.' },
        model: {
          type: 'string',
          description: `Model id from the proxy. Default ${DEFAULT_ASK_MODEL}.`,
        },
        system: { type: 'string', description: 'Optional system prompt.' },
      },
      required: ['prompt'],
    },
  },
];

async function api(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}: ${text.slice(0, 500)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

function slugify(s) {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'image';
}

function timestamp() {
  return new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
}

function mimeToExt(mime) {
  return { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime] ?? 'png';
}

function extToMime(ext) {
  return { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[ext.toLowerCase()] ?? 'image/png';
}

function saveImage(buffer, slug, ext) {
  mkdirSync(INSPIRATION_DIR, { recursive: true });
  const file = join(INSPIRATION_DIR, `${slug}-${timestamp()}.${ext}`);
  writeFileSync(file, buffer);
  return file;
}

function logProvenance(files, model, prompt) {
  const rel = files.map((f) => f.replace(`${REPO_ROOT}/`, ''));
  appendFileSync(
    join(INSPIRATION_DIR, 'LOG.md'),
    `- ${new Date().toISOString()} | ${model} | ${rel.join(', ')} | ${prompt.replace(/\s+/g, ' ').slice(0, 300)}\n`,
  );
}

async function generateImage({ prompt, model = DEFAULT_IMAGE_MODEL, name, size, reference_images = [] }) {
  const slug = slugify(name ?? prompt);
  const saved = [];
  let note = '';

  if (model.startsWith('gpt-image')) {
    const body = { model, prompt, n: 1 };
    if (size) body.size = size;
    const res = await api('/v1/images/generations', body);
    for (const d of res.data ?? []) {
      if (d.b64_json) saved.push(saveImage(Buffer.from(d.b64_json, 'base64'), slug, 'png'));
    }
  } else {
    const parts = [{ type: 'text', text: prompt }];
    for (const ref of reference_images) {
      const abs = resolve(REPO_ROOT, ref);
      const data = readFileSync(abs).toString('base64');
      parts.push({ type: 'image_url', image_url: { url: `data:${extToMime(extname(abs))};base64,${data}` } });
    }
    const res = await api('/v1/chat/completions', {
      model,
      modalities: ['image', 'text'],
      messages: [{ role: 'user', content: parts }],
    });
    const msg = res.choices?.[0]?.message ?? {};
    for (const img of msg.images ?? []) {
      const m = /^data:([^;]+);base64,(.+)$/.exec(img.image_url?.url ?? '');
      if (m) saved.push(saveImage(Buffer.from(m[2], 'base64'), slug, mimeToExt(m[1])));
    }
    if (msg.content) note = `\nModel note: ${msg.content}`;
  }

  if (saved.length === 0) throw new Error(`Model returned no image data (model=${model}).`);
  logProvenance(saved, model, prompt);
  return (
    `Saved (REFERENCE ONLY — do not ship in game):\n${saved.map((f) => `  ${f}`).join('\n')}` +
    `\nView with Read. If liked, regenerate the shipping asset via the game-art workflow.${note}`
  );
}

async function ask({ prompt, model = DEFAULT_ASK_MODEL, system }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  const res = await api('/v1/chat/completions', { model, messages });
  const content = res.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Empty response from ${model}.`);
  return content;
}

// --- stdio JSON-RPC plumbing (newline-delimited) ---

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

async function handle(req) {
  const { id, method, params } = req;
  if (id === undefined) return; // notification
  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion ?? '2025-03-26',
          capabilities: { tools: {} },
          serverInfo: { name: 'agy', version: '1.0.0' },
        },
      });
    } else if (method === 'tools/list') {
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    } else if (method === 'tools/call') {
      const { name, arguments: args = {} } = params;
      const fn = { generate_image: generateImage, ask }[name];
      if (!fn) throw new Error(`Unknown tool: ${name}`);
      const text = await fn(args);
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } });
    } else if (method === 'ping') {
      send({ jsonrpc: '2.0', id, result: {} });
    } else {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (err) {
    if (method === 'tools/call') {
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true } });
    } else {
      send({ jsonrpc: '2.0', id, error: { code: -32603, message: err.message } });
    }
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    try {
      handle(JSON.parse(line));
    } catch {
      // ignore malformed lines
    }
  }
});
process.stdin.on('end', () => process.exit(0));
