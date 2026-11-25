import { test, expect } from '@playwright/test';
import { serveDemo } from './demo-fixture.js';

const origin = 'http://code-demo.test';
const cdn =
	'https://cdn.jsdelivr.net/npm/@aarongustafson/tabbed-interface@3.1.0/';
const toggle = (page) => page.locator('#demo-tabs-controls button');
const pair = (page) => page.locator('.code-demo-pair').first();

test('preserves revealed warnings and drafts across presentation changes', async ({
	page,
}) => {
	await serveDemo(page, { tabs: true });
	await page.goto(`${origin}/demo/index.html`);
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
	await pair(page)
		.getByRole('tab', { name: 'Live example', exact: true })
		.click();
	const warning = pair(page).locator('content-warning');
	const original = await warning.elementHandle();
	const host = await pair(page)
		.locator(':scope > tabbed-interface')
		.elementHandle();
	await warning.getByRole('button').click();
	await pair(page)
		.locator('.demo')
		.evaluate((element) => {
			const input = document.createElement('input');
			input.setAttribute('aria-label', 'Draft');
			element.append(input);
		});
	const draft = pair(page).getByRole('textbox', { name: 'Draft' });
	await draft.fill('Keep this draft');
	for (const enabled of [false, true, false, true]) {
		await toggle(page).focus();
		await page.keyboard.press('Space');
		await expect(toggle(page)).toBeFocused();
		await expect(toggle(page)).toHaveAttribute(
			'aria-pressed',
			String(enabled),
		);
		expect(await host.evaluate((element) => element.isConnected)).toBe(
			true,
		);
		expect(
			await warning.evaluate(
				(element, saved) => element === saved,
				original,
			),
		).toBe(true);
		await expect(warning).toHaveJSProperty('revealed', true);
		await expect(warning.getByRole('button')).toHaveCount(0);
		await expect(draft).toBeVisible();
		await expect(draft).toHaveValue('Keep this draft');
	}
});

test('preserves an early reveal and focused draft when demo tabs arrive late', async ({
	page,
}) => {
	await serveDemo(page, { tabs: true });
	let release;
	const ready = new Promise((resolve) => {
		release = resolve;
	});
	await page.route(`${cdn}define.js`, async (route) => {
		await ready;
		await route.fallback();
	});
	await page.goto(`${origin}/demo/index.html`, {
		waitUntil: 'domcontentloaded',
	});
	const warning = pair(page).locator('content-warning');
	await warning.getByRole('button').click();
	await pair(page)
		.locator('.demo')
		.evaluate((element) => {
			const input = document.createElement('input');
			input.setAttribute('aria-label', 'Early draft');
			element.append(input);
		});
	const draft = pair(page).getByRole('textbox', { name: 'Early draft' });
	await draft.fill('Keep this early draft');
	release();
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
	await expect(
		pair(page).getByRole('tab', { name: 'Live example', exact: true }),
	).toHaveAttribute('aria-selected', 'true');
	await expect(warning).toHaveJSProperty('revealed', true);
	await expect(warning.getByRole('button')).toHaveCount(0);
	await expect(draft).toHaveValue('Keep this early draft');
	await expect(draft).toBeFocused();
});
