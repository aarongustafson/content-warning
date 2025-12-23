import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContentWarningElement } from '../content-warning.js';

describe('ContentWarningElement', () => {
	let element;

	beforeEach(async () => {
		element = document.createElement('content-warning');
		document.body.appendChild(element);
		// Wait for the component to render
		await new Promise((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(resolve)),
		);
	});

	afterEach(() => {
		element.remove();
	});

	it('should be defined', () => {
		expect(customElements.get('content-warning')).toBe(
			ContentWarningElement,
		);
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(ContentWarningElement);
		expect(element).toBeInstanceOf(HTMLElement);
	});

	it('should have a shadow root', () => {
		expect(element.shadowRoot).toBeTruthy();
	});

	describe('Shadow DOM Best Practices', () => {
		it('should create shadow root in constructor', () => {
			const newElement = new ContentWarningElement();
			expect(newElement.shadowRoot).toBeTruthy();
		});

		it('should support the hidden attribute with proper display style', () => {
			element.setAttribute('hidden', '');
			const styles = window.getComputedStyle(element);
			expect(styles.display).toBe('none');
		});

		it('should have default display style of block', () => {
			const styles = window.getComputedStyle(element);
			expect(styles.display).toBe('block');
		});
	});

	describe('Attributes and Properties', () => {
		it('should reflect type attribute to property', () => {
			element.setAttribute('type', 'violence spoilers');
			expect(element.type).toBe('violence spoilers');
		});

		it('should reflect type property to attribute', () => {
			element.type = 'nsfw mature';
			expect(element.getAttribute('type')).toBe('nsfw mature');
		});

		it('should remove type attribute when property set to null', () => {
			element.type = 'test';
			expect(element.hasAttribute('type')).toBe(true);

			element.type = null;
			expect(element.hasAttribute('type')).toBe(false);
		});

		it('should remove type attribute when property set to undefined', () => {
			element.type = 'test';
			expect(element.hasAttribute('type')).toBe(true);

			element.type = undefined;
			expect(element.hasAttribute('type')).toBe(false);
		});

		it('should handle lazy property upgrade (property set before element upgrade)', () => {
			// Create an element but don't connect it yet
			const uninitializedElement =
				document.createElement('content-warning');

			// Set property before connecting (simulates framework setting property before upgrade)
			uninitializedElement.type = 'early-value';

			// Now connect it
			document.body.appendChild(uninitializedElement);

			// Property should be preserved
			expect(uninitializedElement.type).toBe('early-value');
			expect(uninitializedElement.getAttribute('type')).toBe(
				'early-value',
			);

			uninitializedElement.remove();
		});

		it('should accept space-separated warning types', () => {
			element.type = 'violence spoilers nsfw';
			expect(element.type).toBe('violence spoilers nsfw');
		});
	});

	describe('Content Warning Functionality', () => {
		it('should not be revealed by default', () => {
			expect(element.revealed).toBe(false);
		});

		it('should have a warning button initially', () => {
			const button = element.shadowRoot.querySelector('button');
			expect(button).toBeTruthy();
			expect(button.textContent).toContain('Content Warning');
		});

		it('should display warning message with type', async () => {
			element.type = 'violence';
			await new Promise((resolve) => requestAnimationFrame(resolve));
			const button = element.shadowRoot.querySelector('button');
			expect(button.textContent).toContain('violence');
		});

		it('should reveal content on button click', async () => {
			const button = element.shadowRoot.querySelector('button');
			button.click();
			await new Promise((resolve) => requestAnimationFrame(resolve));
			expect(element.revealed).toBe(true);
			// Shadow DOM should be cleared
			const buttonAfter = element.shadowRoot.querySelector('button');
			expect(buttonAfter).toBeFalsy();
		});

		it('should dispatch revealed event when content is shown', () => {
			return new Promise((resolve) => {
				element.type = 'test-type';
				element.addEventListener('content-warning:revealed', (e) => {
					expect(e.detail.type).toBe('test-type');
					resolve();
				});
				const button = element.shadowRoot.querySelector('button');
				button.click();
			});
		});

		it('should set role="alert" when revealed', async () => {
			const button = element.shadowRoot.querySelector('button');
			button.click();
			await new Promise((resolve) => requestAnimationFrame(resolve));
			expect(element.getAttribute('role')).toBe('alert');
		});

		it('should default to "content" when no type is specified', () => {
			const button = element.shadowRoot.querySelector('button');
			expect(button.textContent).toContain('Content Warning: content');
		});

		it('should restore original content when revealed', async () => {
			// Create a new element with content already in place
			const testElement = document.createElement('content-warning');
			testElement.innerHTML = '<p>Hidden content</p>';
			document.body.appendChild(testElement);
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);

			const button = testElement.shadowRoot.querySelector('button');
			button.click();
			await new Promise((resolve) => requestAnimationFrame(resolve));

			expect(testElement.innerHTML).toContain('Hidden content');
			testElement.remove();
		});

		it('should have blurred content in shadow DOM for block display', async () => {
			const blur = element.shadowRoot.querySelector('.content-blur');
			expect(blur).toBeTruthy();
		});

		it('should hide blur for inline display', async () => {
			element.setAttribute('inline', '');
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
			const blur = element.shadowRoot.querySelector('.content-blur');
			const styles = window.getComputedStyle(blur);
			expect(styles.display).toBe('none');
		});
	});

	describe('Display Modes', () => {
		it('should support block display by default', () => {
			const styles = window.getComputedStyle(element);
			expect(styles.display).toBe('block');
		});

		it('should support inline display when inline attribute is set', () => {
			element.setAttribute('inline', '');
			const styles = window.getComputedStyle(element);
			expect(styles.display).toBe('inline');
		});
	});
});
