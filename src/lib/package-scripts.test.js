import { afterAll, test } from 'bun:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dir, '../..');
const isolatedBin = mkdtempSync(join(tmpdir(), 'supaclank-web-bin-'));
const isolatedBun = join(isolatedBin, 'bun');

symlinkSync(process.execPath, isolatedBun);

afterAll(() => {
	rmSync(isolatedBin, { recursive: true, force: true });
});

test('prepare requires only the Bun executable', () => {
	const result = Bun.spawnSync([isolatedBun, 'run', 'prepare'], {
		cwd: projectRoot,
		env: { ...process.env, PATH: isolatedBin }
	});

	assert.equal(result.exitCode, 0, result.stderr.toString());
});
