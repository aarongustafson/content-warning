import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const name = 'content-warning';
const hashes = {
	'esm.html':
		'f4c3ddc70ca855ee83fe701c6fdd7585249f7b19c5679339d8254c523340f0e5',
	'index.html':
		'07cbf82a74ecb2243c4c69a289829f89349a26305e5aa0b4d42e2c1cbef6fc2d',
	'unpkg.html':
		'f4c3ddc70ca855ee83fe701c6fdd7585249f7b19c5679339d8254c523340f0e5',
};

function normalizedCode(file, text) {
	if (file !== 'esm.html') return text;
	return text.replace(
		new RegExp(
			'(https://esm[.]sh/@aarongustafson/content-warning@)[0-9]+[.][0-9]+[.][0-9]+(?:-[0-9A-Za-z.-]+)?(?:[+][0-9A-Za-z.-]+)?(?=/)',
			'g',
		),
		'$1<version>',
	);
}

function verifyDemo(source, file) {
	const template = document.createElement('template');
	template.innerHTML = source;
	const blocks = [...template.content.querySelectorAll('pre code')];
	const text = blocks.map((code) => code.textContent).join('\n');
	expect(
		createHash('sha256').update(normalizedCode(file, text)).digest('hex'),
	).toBe(hashes[file]);
	expect(template.content.querySelector('mark mark')).toBeNull();
	for (const code of blocks) {
		const marks = [...code.querySelectorAll('mark')].map(
			(mark) => mark.textContent,
		);
		const snippets = [
			...code.textContent.matchAll(
				new RegExp(`<\\/?${name}\\b[^>]*>`, 'g'),
			),
			...code.textContent.matchAll(/import\s[\s\S]*?;/g),
			...code.textContent.matchAll(
				/(?:customElements\.(?:get|define)\([\s\S]*?\)|define[A-Z]\w*\(\))/g,
			),
		];
		for (const [snippet] of snippets) {
			expect(
				marks.some((mark) => mark.includes(snippet)),
				`${file}: ${snippet}`,
			).toBe(true);
		}
	}
}

describe('displayed component code', () => {
	for (const file of Object.keys(hashes)) {
		it(`highlights component snippets without changing code in ${file}`, () => {
			verifyDemo(readFileSync(`demo/${file}`, 'utf8'), file);
		});
	}

	it('allows the publishing helper to update CDN versions without changing other displayed code', () => {
		const fixture = `test/.demo-highlighting-release-${randomUUID()}`;
		mkdirSync(`${fixture}/scripts`, { recursive: true });
		mkdirSync(`${fixture}/demo`);
		try {
			writeFileSync(
				`${fixture}/package.json`,
				JSON.stringify({
					name: `@aarongustafson/${name}`,
					type: 'module',
					version: '9.8.7',
				}),
			);
			writeFileSync(
				`${fixture}/scripts/update-demo-versions.js`,
				readFileSync('scripts/update-demo-versions.js'),
			);
			writeFileSync(
				`${fixture}/demo/esm.html`,
				readFileSync('demo/esm.html'),
			);
			execFileSync(process.execPath, [
				`${fixture}/scripts/update-demo-versions.js`,
			]);
			const updated = readFileSync(`${fixture}/demo/esm.html`, 'utf8');
			expect(updated).toContain(`@aarongustafson/${name}@9.8.7/`);
			verifyDemo(updated, 'esm.html');
			expect(() =>
				verifyDemo(
					updated.replace(/(<pre[^>]*><code[^>]*>)/, '$1changed'),
					'esm.html',
				),
			).toThrow();
			const url = `https://esm.sh/@aarongustafson/${name}@9.8.7/define.js`;
			expect(normalizedCode('esm.html', url)).toBe(
				url.replace('@9.8.7/', '@<version>/'),
			);
			expect(normalizedCode('unpkg.html', url)).toBe(url);
			expect(
				normalizedCode(
					'esm.html',
					url.replace('esm.sh', 'other.invalid'),
				),
			).toBe(url.replace('esm.sh', 'other.invalid'));
		} finally {
			rmSync(fixture, { recursive: true, force: true });
		}
	});
});
