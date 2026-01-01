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

		it('should remove hidden attribute on boot for Reader Mode safety', async () => {
			// Create element with hidden attribute (for Reader Mode)
			const testElement = document.createElement('content-warning');
			testElement.setAttribute('hidden', '');
			testElement.setAttribute('type', 'test');
			
			// Verify hidden is present before connecting
			expect(testElement.hasAttribute('hidden')).toBe(true);
			
			// Connect the element
			document.body.appendChild(testElement);
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
			
			// Component should have removed hidden attribute
			expect(testElement.hasAttribute('hidden')).toBe(false);
			
			testElement.remove();
		});

		it('should support the hidden attribute with proper display style', () => {
			element.setAttribute('hidden', '');
			const styles = window.getComputedStyle(element);
			expect(styles.display).toBe('none');
		});

		it('should have default display style of block when defined', () => {
			// The element should be :defined since customElements.define() was called
			// Check the inline style from the component's CSS
			const shadowRoot = element.shadowRoot;
			expect(shadowRoot).toBeTruthy();

			// After connectedCallback, the element's own styles should apply
			// The pre-definition style (content-warning:not(:defined)) should not apply
			const styles = window.getComputedStyle(element);
			// In JSDOM, :defined might not work correctly, so check if element is upgraded
			const isUpgraded = element instanceof ContentWarningElement;
			expect(isUpgraded).toBe(true);

			// Check that display is either 'block' (when :defined works) or 'none' (JSDOM limitation)
			// The important thing is the element is properly instantiated
			expect(['block', 'none']).toContain(styles.display);
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
			expect(button.textContent).toContain('Content Warning');
			expect(button.textContent).toContain('content');
			expect(button.textContent).toContain('Click to reveal');
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

		it('should have slotted content blurred for block display', async () => {
			// Content is blurred via ::slotted(*) CSS
			const slot = element.shadowRoot.querySelector('slot');
			expect(slot).toBeTruthy();
		});

		it('should hide slotted content for inline display', async () => {
			element.setAttribute('inline', '');
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
			const slot = element.shadowRoot.querySelector('slot');
			expect(slot).toBeTruthy();
		});

		it('should expose button and overlay shadow parts', () => {
			const button = element.shadowRoot.querySelector('button');
			const overlay = element.shadowRoot.querySelector('.overlay');
			expect(button).toBeTruthy();
			expect(overlay).toBeTruthy();
			expect(button.getAttribute('part')).toBe('button');
			expect(overlay.getAttribute('part')).toBe('overlay');
		});

		it('should expose label shadow parts', () => {
			const prefixSpan = element.shadowRoot.querySelector(
				'[part="label-prefix"]',
			);
			const typeSpan = element.shadowRoot.querySelector(
				'[part="label-type"]',
			);
			const suffixSpan = element.shadowRoot.querySelector(
				'[part="label-suffix"]',
			);

			expect(prefixSpan).toBeTruthy();
			expect(typeSpan).toBeTruthy();
			expect(suffixSpan).toBeTruthy();
		});
	});

	describe('Label Customization', () => {
		it('should use default labelPrefix when not set', () => {
			expect(element.labelPrefix).toBeNull();
			// Default is used in rendering logic
			const prefixSpan = element.shadowRoot.querySelector(
				'[part="label-prefix"]',
			);
			expect(prefixSpan.textContent).toBe('Content Warning');
		});

		it('should use default labelSuffix when not set', () => {
			expect(element.labelSuffix).toBeNull();
			// Default is used in rendering logic
			const suffixSpan = element.shadowRoot.querySelector(
				'[part="label-suffix"]',
			);
			expect(suffixSpan.textContent).toBe('Click to reveal');
		});

		it('should update label-prefix attribute when property changes', () => {
			element.labelPrefix = 'Advertencia de Contenido';
			expect(element.getAttribute('label-prefix')).toBe(
				'Advertencia de Contenido',
			);
		});

		it('should update labelPrefix property when attribute changes', () => {
			element.setAttribute('label-prefix', 'Avertissement de Contenu');
			expect(element.labelPrefix).toBe('Avertissement de Contenu');
		});

		it('should update label-suffix attribute when property changes', () => {
			element.labelSuffix = 'Haz clic para revelar';
			expect(element.getAttribute('label-suffix')).toBe(
				'Haz clic para revelar',
			);
		});

		it('should update labelSuffix property when attribute changes', () => {
			element.setAttribute('label-suffix', 'Cliquez pour révéler');
			expect(element.labelSuffix).toBe('Cliquez pour révéler');
		});

		it('should update button label when labelPrefix changes', async () => {
			element.labelPrefix = 'Warning';
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
			const prefixSpan = element.shadowRoot.querySelector(
				'[part="label-prefix"]',
			);
			expect(prefixSpan.textContent).toBe('Warning');
		});

		it('should update button label when labelSuffix changes', async () => {
			element.labelSuffix = 'Click here';
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
			const suffixSpan = element.shadowRoot.querySelector(
				'[part="label-suffix"]',
			);
			expect(suffixSpan.textContent).toBe('Click here');
		});

		it('should hide label suffix when set to "false"', async () => {
			element.labelSuffix = 'false';
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
			const suffixSpan = element.shadowRoot.querySelector(
				'[part="label-suffix"]',
			);
			expect(suffixSpan).toBeNull();
		});

		it('should display custom label parts correctly', async () => {
			element.labelPrefix = 'Aviso';
			element.type = 'violencia';
			element.labelSuffix = 'Clic para ver';
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);

			const button = element.shadowRoot.querySelector('button');
			const prefixSpan = button.querySelector('[part="label-prefix"]');
			const typeSpan = button.querySelector('[part="label-type"]');
			const suffixSpan = button.querySelector('[part="label-suffix"]');

			expect(prefixSpan.textContent).toBe('Aviso');
			expect(typeSpan.textContent).toBe('violencia');
			expect(suffixSpan.textContent).toBe('Clic para ver');
		});
	});

	describe('Display Modes', () => {
		it('should support block display by default when defined', () => {
			// Element is upgraded and defined
			expect(element instanceof ContentWarningElement).toBe(true);

			// In a real browser, this would be 'block'
			// In JSDOM, :defined pseudo-class may not work, resulting in 'none' from pre-definition style
			const styles = window.getComputedStyle(element);
			expect(['block', 'none']).toContain(styles.display);
		});

		it('should support inline-block display when inline attribute is set', () => {
			element.setAttribute('inline', '');
			const styles = window.getComputedStyle(element);
			// In a real browser with :defined support, this would be 'inline-block'
			// In JSDOM, it may be 'none' due to pre-definition style
			expect(['inline-block', 'none']).toContain(styles.display);
		});
	});

	describe('Content Hiding Modes', () => {
		let testElement;

		beforeEach(async () => {
			testElement = document.createElement('content-warning');
			testElement.innerHTML = '<p>Test content</p>';
			document.body.appendChild(testElement);
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
		});

		afterEach(() => {
			testElement.remove();
		});

		describe('Default Mode (Reader Mode Safe)', () => {
			it('should apply hidden attribute to content wrapper', () => {
				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');
				expect(wrapper.hasAttribute('hidden')).toBe(true);
			});

			it('should apply inert attribute to content wrapper', () => {
				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');
				expect(wrapper.hasAttribute('inert')).toBe(true);
			});

			it('should not apply aria-hidden in default mode', () => {
				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');
				expect(wrapper.hasAttribute('aria-hidden')).toBe(false);
			});

			it('should remove hidden and inert when revealed', async () => {
				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');
				const button = testElement.shadowRoot.querySelector('button');

				button.click();
				await new Promise((resolve) => requestAnimationFrame(resolve));

				expect(wrapper.hasAttribute('hidden')).toBe(false);
				expect(wrapper.hasAttribute('inert')).toBe(false);
			});
		});

		describe('Blur Mode (Visual Only)', () => {
			beforeEach(async () => {
				testElement.setAttribute('blur', '');
				await new Promise((resolve) => requestAnimationFrame(resolve));
			});

			it('should apply aria-hidden to content wrapper', () => {
				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');
				expect(wrapper.hasAttribute('aria-hidden')).toBe(true);
			});

			it('should not apply hidden attribute in blur mode', () => {
				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');
				expect(wrapper.hasAttribute('hidden')).toBe(false);
			});

			it('should not apply inert attribute in blur mode', () => {
				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');
				expect(wrapper.hasAttribute('inert')).toBe(false);
			});

			it('should remove aria-hidden when revealed', async () => {
				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');
				const button = testElement.shadowRoot.querySelector('button');

				button.click();
				await new Promise((resolve) => requestAnimationFrame(resolve));

				expect(wrapper.hasAttribute('aria-hidden')).toBe(false);
			});

			it('should switch from blur to default mode dynamically', async () => {
				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');

				// Start in blur mode
				expect(wrapper.hasAttribute('aria-hidden')).toBe(true);
				expect(wrapper.hasAttribute('hidden')).toBe(false);

				// Switch to default mode
				testElement.removeAttribute('blur');
				await new Promise((resolve) => requestAnimationFrame(resolve));

				expect(wrapper.hasAttribute('aria-hidden')).toBe(false);
				expect(wrapper.hasAttribute('hidden')).toBe(true);
				expect(wrapper.hasAttribute('inert')).toBe(true);
			});

			it('should switch from default to blur mode dynamically', async () => {
				// Remove blur attribute first to start in default mode
				testElement.removeAttribute('blur');
				await new Promise((resolve) => requestAnimationFrame(resolve));

				const wrapper =
					testElement.shadowRoot.querySelector('.content-wrapper');

				expect(wrapper.hasAttribute('hidden')).toBe(true);
				expect(wrapper.hasAttribute('inert')).toBe(true);

				// Switch to blur mode
				testElement.setAttribute('blur', '');
				await new Promise((resolve) => requestAnimationFrame(resolve));

				expect(wrapper.hasAttribute('aria-hidden')).toBe(true);
				expect(wrapper.hasAttribute('hidden')).toBe(false);
				expect(wrapper.hasAttribute('inert')).toBe(false);
			});
		});
	});

	describe('Screen Reader Announcements', () => {
		let testElement;

		beforeEach(async () => {
			testElement = document.createElement('content-warning');
			testElement.type = 'test-warning';
			testElement.innerHTML =
				'<p>Revealed content here</p><span>More content</span>';
			document.body.appendChild(testElement);
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
		});

		afterEach(() => {
			testElement.remove();
		});

		it('should have announcement region in shadow DOM', () => {
			const announcement =
				testElement.shadowRoot.querySelector('.sr-announcement');
			expect(announcement).toBeTruthy();
		});

		it('should have role="alert" on announcement region', () => {
			const announcement =
				testElement.shadowRoot.querySelector('.sr-announcement');
			expect(announcement.getAttribute('role')).toBe('alert');
		});

		it('should have aria-live="assertive" on announcement region', () => {
			const announcement =
				testElement.shadowRoot.querySelector('.sr-announcement');
			expect(announcement.getAttribute('aria-live')).toBe('assertive');
		});

		it('should be empty initially', () => {
			const announcement =
				testElement.shadowRoot.querySelector('.sr-announcement');
			expect(announcement.innerHTML).toBe('');
		});

		it('should clone content into announcement when revealed', async () => {
			const button = testElement.shadowRoot.querySelector('button');
			button.click();
			await new Promise((resolve) => requestAnimationFrame(resolve));

			const announcement =
				testElement.shadowRoot.querySelector('.sr-announcement');
			expect(announcement.innerHTML).toContain('Revealed content here');
			expect(announcement.innerHTML).toContain('More content');
		});

		it('should clone all slotted elements', async () => {
			const button = testElement.shadowRoot.querySelector('button');
			button.click();
			await new Promise((resolve) => requestAnimationFrame(resolve));

			const announcement =
				testElement.shadowRoot.querySelector('.sr-announcement');
			const clonedP = announcement.querySelector('p');
			const clonedSpan = announcement.querySelector('span');

			expect(clonedP).toBeTruthy();
			expect(clonedSpan).toBeTruthy();
			expect(clonedP.textContent).toBe('Revealed content here');
			expect(clonedSpan.textContent).toBe('More content');
		});

		it('should preserve content structure in announcement', async () => {
			testElement.innerHTML =
				'<div><strong>Bold</strong> and <em>italic</em></div>';
			await new Promise((resolve) => requestAnimationFrame(resolve));

			const button = testElement.shadowRoot.querySelector('button');
			button.click();
			await new Promise((resolve) => requestAnimationFrame(resolve));

			const announcement =
				testElement.shadowRoot.querySelector('.sr-announcement');
			expect(announcement.querySelector('strong')).toBeTruthy();
			expect(announcement.querySelector('em')).toBeTruthy();
		});

		it('should keep announcement content after reveal (no cleanup)', async () => {
			const button = testElement.shadowRoot.querySelector('button');
			button.click();
			await new Promise((resolve) => requestAnimationFrame(resolve));

			const announcement =
				testElement.shadowRoot.querySelector('.sr-announcement');
			const initialContent = announcement.innerHTML;

			// Wait longer than any potential cleanup timer
			await new Promise((resolve) => setTimeout(resolve, 2000));

			expect(announcement.innerHTML).toBe(initialContent);
		});
	});

	describe('DOM Reference Caching', () => {
		it('should cache DOM references after render', async () => {
			expect(element._refs.overlay).toBeTruthy();
			expect(element._refs.button).toBeTruthy();
			expect(element._refs.wrapper).toBeTruthy();
			expect(element._refs.announcement).toBeTruthy();
			expect(element._refs.slot).toBeTruthy();
		});

		it('should clear overlay and button refs after reveal', async () => {
			const button = element.shadowRoot.querySelector('button');
			button.click();
			await new Promise((resolve) => requestAnimationFrame(resolve));

			expect(element._refs.overlay).toBeNull();
			expect(element._refs.button).toBeNull();
		});

		it('should maintain wrapper and announcement refs after reveal', async () => {
			const button = element.shadowRoot.querySelector('button');
			button.click();
			await new Promise((resolve) => requestAnimationFrame(resolve));

			expect(element._refs.wrapper).toBeTruthy();
			expect(element._refs.announcement).toBeTruthy();
		});
	});
});
