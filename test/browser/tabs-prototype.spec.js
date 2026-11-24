import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { expectNativeFocus, serveDemo } from './demo-fixture.js';

const root = new URL('../../', import.meta.url);
const distribution = new URL(
	'node_modules/@aarongustafson/tabbed-interface/',
	root,
);
const cdn =
	'https://cdn.jsdelivr.net/npm/@aarongustafson/tabbed-interface@3.0.4/';
const origin = 'http://code-demo.test';
const storageKey = 'web-component-demo-tabs';

test.beforeEach(async ({ page }) => {
	await serveDemo(page);
	await page.route(`${cdn}**`, async (route) => {
		const path = route.request().url().slice(cdn.length);
		expect(['define.js', 'tabbed-interface.js']).toContain(path);
		await route.fulfill({
			contentType: 'text/javascript',
			body: await readFile(new URL(path, distribution), 'utf8'),
		});
	});
	await page.route(`${origin}/another-component/**`, async (route) => {
		const path = new URL(route.request().url()).pathname.slice(
			'/another-component/'.length,
		);
		const extension = path.split('.').at(-1);
		if (!['html', 'css', 'js'].includes(extension)) return route.abort();
		await route.fulfill({
			contentType:
				extension === 'html'
					? 'text/html'
					: extension === 'css'
						? 'text/css'
						: 'text/javascript',
			body: await readFile(new URL(path, root), 'utf8'),
		});
	});
});

const toggle = (page) =>
	page.getByRole('button', { name: 'Use tabs for examples', exact: true });
const firstPair = (page) => page.locator('.code-demo-pair').first();

for (const appearance of ['light', 'dark', 'forced-colors']) {
	test(`joins the tabs and panel borders in ${appearance}`, async ({
		page,
		browserName,
	}) => {
		test.skip(
			appearance === 'forced-colors' && browserName !== 'chromium',
			'Forced-color emulation is supported by Chromium.',
		);
		await page.emulateMedia({
			colorScheme: appearance === 'dark' ? 'dark' : 'light',
			forcedColors: appearance === 'forced-colors' ? 'active' : 'none',
		});
		await page.goto(`${origin}/demo/index.html?tabs`);
		await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
		const pair = firstPair(page);
		for (const name of ['Live example', 'Code']) {
			await pair.getByRole('tab', { name, exact: true }).click();
			await expect
				.poll(() =>
					pair.locator('tabbed-interface').evaluate((host) => {
						const selected = host.shadowRoot.querySelector(
							'[role="tab"][aria-selected="true"]',
						);
						const panel = host.querySelector(
							host.activeIndex === 0 ? '.code-panel' : '.demo',
						);
						const tabStyle = getComputedStyle(selected);
						const panelStyle = getComputedStyle(panel);
						const tabRect = selected.getBoundingClientRect();
						const panelRect = panel.getBoundingClientRect();
						return {
							matchingBorder:
								tabStyle.borderInlineStartColor ===
								panelStyle.borderInlineStartColor,
							matchingBackground:
								tabStyle.backgroundColor ===
								panelStyle.backgroundColor,
							hiddenSeam:
								tabStyle.borderBlockEndColor ===
								panelStyle.backgroundColor,
							corners: [
								panelStyle.borderStartStartRadius,
								panelStyle.borderStartEndRadius,
							],
							overlap: Math.round(tabRect.bottom - panelRect.top),
						};
					}),
				)
				.toMatchObject({
					matchingBorder: true,
					...(appearance === 'forced-colors'
						? {}
						: { matchingBackground: true, hiddenSeam: true }),
					corners: ['0px', '0px'],
					overlap: 1,
				});
		}
	});
}

for (const width of [1280, 320]) {
	test(`gives panels a minimum height and centers live content at ${width}px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(`${origin}/demo/index.html?tabs`);
		const pair = page.locator('#inline-usage .code-demo-pair');
		await expect(
			pair.getByRole('tab', { name: 'Live example', exact: true }),
		).toHaveAttribute('aria-selected', 'true');
		await expect
			.poll(() =>
				pair.locator('.demo').evaluate((demo) => {
					const host = demo.closest('tabbed-interface');
					const panel = host.shadowRoot.querySelector(
						'[role="tabpanel"]:not([hidden])',
					);
					const frame = demo.getBoundingClientRect();
					const content = demo
						.querySelector('p')
						.getBoundingClientRect();
					const minimum =
						16 *
						parseFloat(
							getComputedStyle(document.documentElement).fontSize,
						);
					return {
						frameMeetsMinimum: frame.height >= minimum,
						panelMeetsMinimum:
							panel.getBoundingClientRect().height >= minimum,
						centered:
							Math.abs(
								content.top +
									content.bottom -
									frame.top -
									frame.bottom,
							) < 2,
					};
				}),
			)
			.toEqual({
				frameMeetsMinimum: true,
				panelMeetsMinimum: true,
				centered: true,
			});
		await pair.getByRole('tab', { name: 'Code', exact: true }).click();
		expect(
			await pair.locator('.code-panel').evaluate((code) => {
				const minimum =
					16 *
					parseFloat(
						getComputedStyle(document.documentElement).fontSize,
					);
				return code.getBoundingClientRect().height >= minimum;
			}),
		).toBe(true);
		await pair.locator('.demo > p').evaluate((content) => {
			content.style.blockSize = '24rem';
		});
		await pair
			.getByRole('tab', { name: 'Live example', exact: true })
			.click();
		await expect
			.poll(() =>
				pair.locator('.demo').evaluate((demo) => {
					const frame = demo.getBoundingClientRect();
					const content = demo
						.querySelector('p')
						.getBoundingClientRect();
					const authoredHeight =
						24 *
						parseFloat(
							getComputedStyle(document.documentElement).fontSize,
						);
					return (
						content.height >= authoredHeight &&
						content.top >= frame.top &&
						content.bottom <= frame.bottom
					);
				}),
			)
			.toBe(true);
	});
}

test('defaults to Live example with Code first and supports native keyboard navigation', async ({
	page,
}) => {
	await page.goto(`${origin}/demo/index.html?tabs`);
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
	await expect(toggle(page).locator('[data-tabs-state]')).toHaveText('On');
	const pair = firstPair(page);
	await expect(pair.getByRole('tab')).toHaveText(['Code', 'Live example']);
	const live = pair.getByRole('tab', { name: 'Live example', exact: true });
	const code = pair.getByRole('tab', { name: 'Code', exact: true });
	await expect(live).toHaveAttribute('aria-selected', 'true');
	await expect(pair.locator('pre')).toBeHidden();
	await expect(pair.locator('.demo')).toBeVisible();
	await live.focus();
	await page.keyboard.press('ArrowLeft');
	await expect(code).toBeFocused();
	await expect(live).toHaveAttribute('aria-selected', 'true');
	await page.keyboard.press('Space');
	await expect(code).toHaveAttribute('aria-selected', 'true');
	await expect(pair.locator('pre')).toBeVisible();
	await expect(pair.locator('.demo')).toBeHidden();
	await expectNativeFocus(toggle(page));
	await page.keyboard.press('Space');
	await page.keyboard.press('Space');
	await expect(code).toHaveAttribute('aria-selected', 'true');
	await expect(
		pair.getByRole('button', { name: 'Copy', exact: true }),
	).toHaveCount(1);
});

test('switches every pair without replacing examples, losing values, or resetting revealed content', async ({
	page,
}) => {
	await page.goto(`${origin}/demo/index.html?tabs`);
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
	const pair = firstPair(page);
	const warning = pair.locator('content-warning');
	const original = await warning.elementHandle();
	await warning.getByRole('button').click();
	await pair.locator('.demo').evaluate((node) => {
		const input = document.createElement('input');
		input.setAttribute('aria-label', 'Draft');
		input.value = 'Keep this draft';
		node.append(input);
	});
	await toggle(page).focus();
	await page.keyboard.press('Space');
	await expect(toggle(page)).toBeFocused();
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
	await expect(toggle(page).locator('[data-tabs-state]')).toHaveText('Off');
	await expect(
		page.locator('.code-demo-pair > tabbed-interface'),
	).toHaveCount(0);
	await expect(pair.locator(':scope > micro-lighter')).toBeVisible();
	await expect(pair.locator(':scope > .demo')).toBeVisible();
	await page.keyboard.press('Space');
	await expect(toggle(page)).toBeFocused();
	await expect
		.poll(() => page.locator('.code-demo-pair > tabbed-interface').count())
		.toBe(await page.locator('.code-demo-pair').count());
	expect(
		await warning.evaluate((node, saved) => node === saved, original),
	).toBe(true);
	await expect(warning).toHaveAttribute('revealed', '');
	await expect(warning.getByRole('button')).toHaveCount(0);
	await expect(pair.getByRole('textbox', { name: 'Draft' })).toHaveValue(
		'Keep this draft',
	);
});

test('remembers the choice across reloads and sibling repository paths', async ({
	page,
	context,
}) => {
	await page.goto(`${origin}/demo/index.html?tabs`);
	await toggle(page).click();
	expect(
		await page.evaluate((key) => localStorage.getItem(key), storageKey),
	).toBe('off');
	const cookies = await context.cookies(`${origin}/another-component/`);
	expect(
		cookies.find((cookie) => cookie.name === storageKey),
	).toBeUndefined();
	await page.goto(`${origin}/another-component/demo/index.html?tabs`);
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
	await expect(
		page.locator('.code-demo-pair > tabbed-interface'),
	).toHaveCount(0);
	await toggle(page).click();
	await page.reload();
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
	await expect(
		firstPair(page).getByRole('tab', { name: 'Live example', exact: true }),
	).toHaveAttribute('aria-selected', 'true');
});

test('keeps code and examples usable if the optional tabs module cannot load', async ({
	page,
}) => {
	await page.route(`${cdn}**`, (route) => route.abort());
	await page.goto(`${origin}/demo/index.html?tabs`);
	await expect(page.locator('#demo-tabs-status')).toContainText(
		'could not load',
	);
	await expect(toggle(page)).toBeHidden();
	await expect(firstPair(page).locator('pre')).toBeVisible();
	await expect(
		firstPair(page).locator('content-warning button'),
	).toBeVisible();
});

for (const mode of ['blocked', 'unavailable', 'ignored']) {
	test(`still toggles and reports the limitation when storage is ${mode}`, async ({
		page,
	}) => {
		await page.addInitScript((behavior) => {
			Object.defineProperty(window, 'localStorage', {
				configurable: true,
				get() {
					if (behavior === 'unavailable') {
						throw new DOMException(
							'Storage access denied',
							'SecurityError',
						);
					}
					return {
						getItem: () => null,
						setItem() {
							if (behavior === 'blocked') {
								throw new DOMException(
									'Storage is full',
									'QuotaExceededError',
								);
							}
						},
					};
				},
			});
		}, mode);
		await page.goto(`${origin}/demo/index.html?tabs`);
		await toggle(page).click();
		await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
		await expect(page.locator('#demo-tabs-status')).toContainText(
			'this page',
		);
		await expect(firstPair(page).locator('pre')).toBeVisible();
		await expect(firstPair(page).locator('.demo')).toBeVisible();
		await toggle(page).click();
		await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('#demo-tabs-status')).toContainText(
			'this page',
		);
	});
}

test('stays within a narrow viewport and exposes both panels in print', async ({
	page,
}) => {
	await page.goto(`${origin}/demo/index.html?tabs`);
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
	await page.setViewportSize({ width: 320, height: 900 });
	await expect
		.poll(() =>
			page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		)
		.toBe(true);
	await expect(firstPair(page).locator('.demo')).toBeVisible();
	await page.emulateMedia({ media: 'print' });
	await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
	await expect(firstPair(page).locator('pre')).toBeVisible();
	await expect(firstPair(page).locator('.demo')).toBeVisible();
	await expect(toggle(page)).toBeHidden();
	await expect(firstPair(page).locator('.demo')).toHaveCSS(
		'min-block-size',
		'0px',
	);
	await page.emulateMedia({ media: 'screen' });
	await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
	await expect(
		firstPair(page).getByRole('tab', { name: 'Live example', exact: true }),
	).toHaveAttribute('aria-selected', 'true');
});

test('does not change the normal demo without the prototype query parameter', async ({
	page,
}) => {
	await page.goto(`${origin}/demo/index.html`);
	await expect(toggle(page)).toBeHidden();
	await expect(
		page.locator('.code-demo-pair > tabbed-interface'),
	).toHaveCount(0);
	await expect(firstPair(page).locator('pre')).toBeVisible();
	await expect(firstPair(page).locator('.demo')).toBeVisible();
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });
	test('keeps code readable without exposing a dead toggle', async ({
		page,
	}) => {
		await page.goto(`${origin}/demo/index.html?tabs`);
		await expect(toggle(page)).toBeHidden();
		await expect(firstPair(page).locator('pre')).toBeVisible();
		await expect(page.locator('#inline-usage .demo')).toContainText(
			'episode 5',
		);
	});
});
