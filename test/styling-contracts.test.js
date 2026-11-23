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

it('identifies the component in the generated site-root page title', async () => {
	const workflow = await readFile('.github/workflows/pages.yml', 'utf8');
	const pkg = JSON.parse(await readFile('package.json', 'utf8'));
	const title = workflow.match(/<title>(.*?)<\/title>/s)?.[1];
	expect(title).toBe(pkg.name.split('/').pop());
});

it('trims block-edge margins inside demo sections', async () => {
	const styles = await readFile('demo/demo-shell.css', 'utf8');
	expect(styles).toMatch(
		/\.demo-section(?:,\s*\.api-reference)?\s*\{[^}]*\bmargin-trim:\s*block;/,
	);
});

it('names the multiple-warning and styled-button snippets after their own examples', async () => {
	const template = document.createElement('template');
	template.innerHTML = await readFile('demo/index.html', 'utf8');
	for (const name of ['Multiple Inline Warnings', 'Styled Button Text']) {
		const heading = [...template.content.querySelectorAll('h3')].find(
			(heading) => heading.textContent === name,
		);
		const pre = [...template.content.querySelectorAll('pre')].find(
			(pre) =>
				heading.compareDocumentPosition(pre) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		);
		expect(pre.getAttribute('aria-label')).toMatch(
			new RegExp(`^${name} code \\d+$`),
		);
	}
});

describe('authored demo examples', () => {
	for (const page of ['index.html', 'esm.html', 'unpkg.html']) {
		it(`${page} gives every code/live example its own unique destination`, async () => {
			const template = document.createElement('template');
			template.innerHTML = await readFile(`demo/${page}`, 'utf8');
			const root = template.content;
			const ids = [...root.querySelectorAll('[id]')].map(
				(node) => node.id,
			);
			expect(new Set(ids).size).toBe(ids.length);
			const destinations = [];
			for (const pair of root.querySelectorAll('.code-demo-pair')) {
				const block = pair.parentElement;
				expect(block.id).toMatch(/^[a-z][a-z0-9-]+$/);
				expect(
					block.querySelector(':scope > h2, :scope > h3'),
				).not.toBeNull();
				expect(block.querySelector(':scope > p')).not.toBeNull();
				destinations.push(block.id);
			}
			expect(new Set(destinations).size).toBe(destinations.length);
		});

		it(`${page} displays the authored warning, language, and image configuration`, async () => {
			const template = document.createElement('template');
			template.innerHTML = await readFile(`demo/${page}`, 'utf8');
			for (const pair of template.content.querySelectorAll(
				'.code-demo-pair',
			)) {
				const code = pair.querySelector('pre code').textContent;
				const live = pair.querySelector('.demo');
				for (const tag of ['content-warning', 'img']) {
					// Compare plain attribute tokens; never interpret displayed code as HTML.
					const displayed = [
						...code.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'g')),
					].map((match) =>
						[...match[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)]
							.map((attribute) => [
								attribute[1],
								attribute[2] ?? '',
							])
							.sort(([a], [b]) => a.localeCompare(b)),
					);
					const authored = [...live.querySelectorAll(tag)].map(
						(node) =>
							[...node.attributes]
								.map((attribute) => [
									attribute.name,
									attribute.value,
								])
								.sort(([a], [b]) => a.localeCompare(b)),
					);
					expect(displayed, `${page}: ${tag} configuration`).toEqual(
						authored,
					);
				}
			}
		});
	}

	for (const page of ['esm.html', 'unpkg.html']) {
		it(`${page} displays the module code it executes`, async () => {
			const template = document.createElement('template');
			template.innerHTML = await readFile(`demo/${page}`, 'utf8');
			const module = [
				...template.content.querySelectorAll(
					'script[type="module"]:not([src])',
				),
			].find((script) => script.textContent.includes('https://'));
			const displayed = [
				...template.content.querySelectorAll('pre code'),
			].find((code) => code.textContent.includes('https://'));
			expect(displayed).toBeDefined();
			const normalize = (text) => text.replace(/\s+/g, ' ').trim();
			expect(normalize(displayed.textContent)).toBe(
				normalize(module.textContent),
			);
		});
	}
});
