import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceStatic = path.join(root, '.next', 'static');
const targetStatic = path.join(root, '.next', 'standalone', '.next', 'static');
const sourcePublic = path.join(root, 'public');
const targetPublic = path.join(root, '.next', 'standalone', 'public');

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

await mkdir(path.dirname(targetStatic), { recursive: true });
await cp(sourceStatic, targetStatic, { recursive: true });

if (await exists(sourcePublic)) {
  await cp(sourcePublic, targetPublic, { recursive: true });
}

console.log('Standalone assets copied.');
