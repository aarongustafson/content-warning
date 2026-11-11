import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const paths = [
	'content-warning.js',
	'define.js',
	'demo/styles.css',
	'demo/index.html',
	'demo/esm.html',
	'demo/unpkg.html',
];
const files = new Map(
	await Promise.all(
		paths.map(async (path) => [
			`/${path}`,
			await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'),
		]),
	),
);

test.beforeEach(async ({ page }) => {
	await page.route('**/*', async (route) => {
		const url = new URL(route.request().url());
		const path = ['esm.sh', 'unpkg.com'].includes(url.hostname)
			? url.pathname.endsWith('/content-warning.js')
				? '/content-warning.js'
				: '/define.js'
			: url.pathname;
		const body = files.get(path);
		if (body === undefined) {
			await route.abort();
			return;
		}
		await route.fulfill({
			contentType: path.endsWith('.html')
				? 'text/html'
				: path.endsWith('.css')
					? 'text/css'
					: 'text/javascript',
			body,
		});
	});
});

async function fixture(page, attributes = '') {
	await page.goto('http://component.test/demo/index.html');
	await page.setContent(`<!doctype html><html lang="en"><head>
		<style>:root {color-scheme: light dark} body {background: Canvas; color: CanvasText}
		content-warning {min-block-size: 12rem; margin-block: 1rem}
		content-warning[inline] {min-block-size: 0}</style></head><body>
		<content-warning id="sample" ${attributes} type="spoilers" label-prefix="Warning" label-suffix="Reveal">
			<div style="block-size:12rem;background:linear-gradient(90deg,white,black,red,yellow,blue)">Hidden example content</div>
		</content-warning><button id="after">After the warning</button>
	</body></html>`);
	await page.addScriptTag({
		type: 'module',
		content: files
			.get('/define.js')
			.replace(
				"'./content-warning.js'",
				"'http://component.test/content-warning.js'",
			),
	});
	await expect(page.locator('#sample button')).toBeVisible();
}

async function contrast(locator) {
	return locator.evaluate((element) => {
		const style = getComputedStyle(element);
		const surface = getComputedStyle(element.closest('button') ?? element);
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d');
		if (!context)
			throw new Error('Canvas color measurement is unavailable.');
		const pixel = (color) => {
			context.clearRect(0, 0, 1, 1);
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return [...context.getImageData(0, 0, 1, 1).data];
		};
		const background = pixel(surface.backgroundColor);
		if (background[3] !== 255)
			throw new Error('The warning button needs an opaque backplate.');
		const luminance = (color) =>
			color
				.slice(0, 3)
				.map((channel) => {
					const value = channel / 255;
					return value <= 0.04045
						? value / 12.92
						: ((value + 0.055) / 1.055) ** 2.4;
				})
				.reduce(
					(sum, channel, index) =>
						sum + channel * [0.2126, 0.7152, 0.0722][index],
					0,
				);
		const ratio = (color) => {
			context.fillStyle = surface.backgroundColor;
			context.fillRect(0, 0, 1, 1);
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			const first = luminance([...context.getImageData(0, 0, 1, 1).data]);
			const second = luminance(background);
			return (
				(Math.max(first, second) + 0.05) /
				(Math.min(first, second) + 0.05)
			);
		};
		return {
			text: ratio(style.color),
			focus: ratio(style.outlineColor),
			opacity: style.opacity,
			outlineWidth: parseFloat(style.outlineWidth),
			outlineOffset: parseFloat(style.outlineOffset),
		};
	});
}

for (const scheme of ['light', 'dark']) {
	for (const mode of ['', 'blur', 'inline']) {
		test(`${scheme} ${mode || 'block'} warning has an opaque readable button and inset focus`, async ({
			page,
		}) => {
			await page.emulateMedia({ colorScheme: scheme });
			await fixture(page, mode);
			const button = page.locator('#sample button');
			await button.focus();
			const normal = await contrast(button);
			expect(normal.text).toBeGreaterThanOrEqual(4.5);
			expect(normal.focus).toBeGreaterThanOrEqual(3);
			expect(normal.outlineWidth).toBeGreaterThanOrEqual(2);
			expect(normal.outlineOffset).toBeLessThan(0);
			await button.hover();
			expect((await contrast(button)).opacity).toBe('1');
			await page.keyboard.press('Enter');
			await expect(page.locator('#sample')).toHaveAttribute(
				'revealed',
				'',
			);
			await expect(button).toHaveCount(0);
			await expect(page.locator('#sample').locator('slot')).toHaveCount(
				1,
			);
		});
	}
}

for (const demo of ['index', 'esm', 'unpkg']) {
	test(`${demo} demo keeps every warning label readable, including custom parts`, async ({
		page,
	}) => {
		await page.goto(`http://component.test/demo/${demo}.html`);
		await expect(
			page.locator('content-warning button').first(),
		).toBeVisible();
		for (const button of await page
			.locator('content-warning button')
			.all()) {
			expect((await contrast(button)).text).toBeGreaterThanOrEqual(4.5);
			for (const label of await button.locator('span').all()) {
				expect((await contrast(label)).text).toBeGreaterThanOrEqual(
					4.5,
				);
			}
		}
	});
}

test('blur backplate and focus survive supported part customization', async ({
	page,
}) => {
	await fixture(page, 'blur class="themed"');
	await page.addStyleTag({
		content: `content-warning.themed::part(button) {background:#332211; color:#ffffff; border-color:currentColor}`,
	});
	const button = page.locator('#sample button');
	await button.focus();
	expect((await contrast(button)).text).toBeGreaterThanOrEqual(4.5);
	expect((await contrast(button)).focus).toBeGreaterThanOrEqual(3);
	await page
		.locator('#sample')
		.evaluate((node) =>
			node.style.setProperty('--content-warning-color', '#ffff00'),
		);
	await expect(button).toHaveCSS('outline-color', 'rgb(255, 255, 0)');
});

// Nine Canvas pairs cover all 62 observations in the November 2026 study.
// These substitute recorded values; they do not emulate OS text backplates.
const canvasPalettes = [
	[16, '#ffffff', '#000000'],
	[8, '#121212', '#ffffff'],
	[3, '#1c1b22', '#fbfbfe'],
	[1, '#1e1e1e', '#ffffff'],
	[7, '#202020', '#ffffff'],
	[6, '#fffaef', '#3d3d3d'],
	[12, '#2d3236', '#ffffff'],
	[8, '#000000', '#ffffff'],
	[1, '#282828', '#ffffff'],
];

for (const [observations, Canvas, CanvasText] of canvasPalettes) {
	test(`recorded Canvas ${Canvas} (${observations} observations) protects blur labels`, async ({
		page,
	}) => {
		await page.route('http://component.test/content-warning.js', (route) =>
			route.fulfill({
				contentType: 'text/javascript',
				body: files
					.get('/content-warning.js')
					.replace(
						/\b(CanvasText|Canvas)\b/g,
						(token) => ({ Canvas, CanvasText })[token],
					),
			}),
		);
		await fixture(page, 'blur');
		const button = page.locator('#sample button');
		await button.focus();
		expect((await contrast(button)).text).toBeGreaterThanOrEqual(4.5);
		expect((await contrast(button)).focus).toBeGreaterThanOrEqual(3);
	});
}

for (const demo of ['index', 'esm', 'unpkg']) {
	test(`${demo} code/live pairs work at wide and narrow widths`, async ({
		page,
	}) => {
		await page.goto(`http://component.test/demo/${demo}.html`);
		await expect(
			page.locator('content-warning button').first(),
		).toBeVisible();
		const pairs = page.locator('.code-demo-pair');
		expect(await pairs.count()).toBeGreaterThan(0);
		for (const width of [1280, 320]) {
			await page.setViewportSize({ width, height: 900 });
			for (const pair of await pairs.all()) {
				await expect(pair.locator(':scope > pre')).toHaveCount(1);
				await expect(pair.locator(':scope > .demo')).toHaveCount(1);
				const code = await pair.locator(':scope > pre').boundingBox();
				const live = await pair.locator(':scope > .demo').boundingBox();
				if (width >= 768) expect(live.x).toBeGreaterThan(code.x);
				else
					expect(live.y).toBeGreaterThanOrEqual(code.y + code.height);
			}
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth),
			).toBeLessThanOrEqual(width);
		}
	});
}

test.describe('no JavaScript', () => {
	test.use({ javaScriptEnabled: false });
	test('preserves authored hiding and inline fallback text without dead controls', async ({
		page,
	}) => {
		await page.goto('http://component.test/demo/index.html');
		await expect(page.locator('content-warning button')).toHaveCount(0);
		for (const host of await page.locator('content-warning[hidden]').all())
			await expect(host).not.toBeVisible();
		await expect(
			page.locator('content-warning[inline]:not([hidden])').first(),
		).toHaveText('episode 5');
	});
});

test('forced-color emulation keeps automatic adjustment and readable labels', async ({
	page,
	browserName,
}) => {
	test.skip(
		browserName !== 'chromium',
		'Actual platform theme checks remain separate from Chromium emulation.',
	);
	await page.emulateMedia({ forcedColors: 'active' });
	await fixture(page, 'blur');
	const button = page.locator('#sample button');
	await button.focus();
	await expect(button).toHaveCSS('forced-color-adjust', 'auto');
	expect((await contrast(button)).text).toBeGreaterThanOrEqual(4.5);
	expect((await contrast(button)).focus).toBeGreaterThanOrEqual(3);
});

for (const demo of ['index', 'esm', 'unpkg']) {
	test(`${demo} keeps authored hidden warnings hidden when modules fail`, async ({
		page,
	}) => {
		await page.route('**/*.js*', (route) => route.abort());
		await page.goto(`http://component.test/demo/${demo}.html`);
		await expect(page.locator('content-warning button')).toHaveCount(0);
		const hidden = page.locator('content-warning[hidden]');
		expect(await hidden.count()).toBeGreaterThan(0);
		for (const host of await hidden.all())
			await expect(host).not.toBeVisible();
	});
}
