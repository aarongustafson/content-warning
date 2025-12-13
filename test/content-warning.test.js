import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContentWarningElement } from '../content-warning.js';

describe('ContentWarningElement', () => {
	let element;

	beforeEach(async () => {
		element = document.createElement('content-warning');
		document.body.appendChild(element);
		// Wait for the component to render
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	});

	afterEach(() => {
		element.remove();
	});

	it('should be defined', () => {
		expect(customElements.get('content-warning')).toBe(ContentWarningElement);
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
			const uninitializedElement = document.createElement('content-warning');

			// Set property before connecting (simulates framework setting property before upgrade)
			uninitializedElement.type = 'early-value';

			// Now connect it
			document.body.appendChild(uninitializedElement);

			// Property should be preserved
			expect(uninitializedElement.type).toBe('early-value');
			expect(uninitializedElement.getAttribute('type')).toBe('early-value');

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

		it('should have a warning overlay initially', () => {
			const overlay = element.shadowRoot.querySelector('.content-warning-overlay');
			expect(overlay).toBeTruthy();
			expect(overlay.style.display).not.toBe('none');
		});

		it('should display warning message with type', async () => {
			element.type = 'violence';
			await new Promise(resolve => requestAnimationFrame(resolve));
			const message = element.shadowRoot.querySelector('.content-warning-message');
			expect(message.textContent).toContain('violence');
		});

		it('should reveal content on click', () => {
			element.click();
			expect(element.revealed).toBe(true);
			const overlay = element.shadowRoot.querySelector('.content-warning-overlay');
			expect(overlay.style.display).toBe('none');
		});

		it('should reveal content on Enter key', () => {
			const event = new KeyboardEvent('keydown', { key: 'Enter' });
			element.dispatchEvent(event);
			expect(element.revealed).toBe(true);
		});

		it('should not reveal on other keys', () => {
			const event = new KeyboardEvent('keydown', { key: 'Space' });
			element.dispatchEvent(event);
			expect(element.revealed).toBe(false);
		});

		it('should dispatch revealed event when content is shown', () => {
			return new Promise((resolve) => {
				element.type = 'test-type';
				element.addEventListener('content-warning:revealed', (e) => {
					expect(e.detail.type).toBe('test-type');
					resolve();
				});
				element.click();
			});
		});

		it('should remove tabindex when revealed', () => {
			expect(element.hasAttribute('tabindex')).toBe(true);
			element.click();
			expect(element.hasAttribute('tabindex')).toBe(false);
		});

		it('should remove role when revealed', () => {
			expect(element.getAttribute('role')).toBe('button');
			element.click();
			expect(element.hasAttribute('role')).toBe(false);
		});

		it('should set appropriate aria-label based on type', async () => {
			element.type = 'violence spoilers';
			await new Promise(resolve => requestAnimationFrame(resolve));
			const ariaLabel = element.getAttribute('aria-label');
			expect(ariaLabel).toContain('violence spoilers');
		});

		it('should default to "content" when no type is specified', () => {
			const message = element.shadowRoot.querySelector('.content-warning-message');
			expect(message.textContent).toContain('Content Warning: content');
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
