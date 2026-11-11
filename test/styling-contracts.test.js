import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const source = await readFile('content-warning.js', 'utf8');
const types = await readFile('content-warning.d.ts', 'utf8');
const manifest = JSON.parse(await readFile('custom-elements.json', 'utf8'));
const declaration = manifest.modules.find(
	(module) => module.path === 'content-warning.js',
).declarations[0];
const properties = [
	...new Set(
		[...source.matchAll(/var\((--content-warning-[\w-]+)/g)].map(
			(match) => match[1],
		),
	),
].sort();

describe('published styling contracts', () => {
	it('documents exactly the implemented custom properties in the manifest and declarations', () => {
		expect(
			declaration.cssProperties.map((property) => property.name).sort(),
		).toEqual(properties);
		expect(
			[...types.matchAll(/@cssprop (--content-warning-[\w-]+)/g)]
				.map((match) => match[1])
				.sort(),
		).toEqual(properties);
		expect(
			declaration.cssProperties.find(
				(property) => property.name === '--content-warning-color',
			).default,
		).toBe('currentColor');
	});

	it('documents the blur attribute used by the backplate examples', () => {
		expect(
			declaration.attributes.find(
				(attribute) => attribute.name === 'blur',
			).type.text,
		).toBe('boolean');
	});

	it('keeps class-only exports distinct from automatic registration', () => {
		const classes = manifest.modules.find(
			(module) => module.path === 'content-warning.js',
		);
		expect(
			classes.exports.some(
				(entry) => entry.kind === 'custom-element-definition',
			),
		).toBe(false);
		const registration = manifest.modules.find(
			(module) => module.path === 'define.js',
		);
		expect(
			registration.exports.find(
				(entry) => entry.kind === 'custom-element-definition',
			).name,
		).toBe('content-warning');
	});
});
