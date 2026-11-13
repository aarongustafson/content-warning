import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
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

describe('displayed component code', () => {
	for (const [file, hash] of Object.entries(hashes)) {
		it(`highlights component snippets without changing code in ${file}`, () => {
			const template = document.createElement('template');
			template.innerHTML = readFileSync(`demo/${file}`, 'utf8');
			const blocks = [...template.content.querySelectorAll('pre code')];
			const text = blocks.map((code) => code.textContent).join('\n');
			expect(createHash('sha256').update(text).digest('hex')).toBe(hash);
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
		});
	}
});
