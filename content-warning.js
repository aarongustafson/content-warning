/**
 * ContentWarningElement - A web component for block and inline content warnings.
 *
 * Based on the original concept: https://codepen.io/aarongustafson/pen/QWZpqPe
 *
 * @element content-warning
 *
 * @attr {string} type - Space-separated list of warning types (e.g., "violence spoilers")
 *
 * @fires content-warning:revealed - Fired when the content is revealed by the user
 *
 * @slot - Default slot for the content that needs a warning
 *
 * @cssprop --content-warning-bg - Background color of the warning overlay (default: rgba(0, 0, 0, 0.9))
 * @cssprop --content-warning-color - Text color of the warning message (default: #fff)
 * @cssprop --content-warning-border - Border style for the warning (default: 2px solid currentColor)
 * @cssprop --content-warning-padding - Padding for the warning overlay (default: 1rem)
 * @cssprop --content-warning-font-size - Font size for the warning message (default: 1rem)
 */
export class ContentWarningElement extends HTMLElement {
	static get observedAttributes() {
		return ['type'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = {
			isRendered: false,
			revealed: false,
			originalContent: null,
			computedStyles: null,
			isInline: false,
		};

		// Bind event handlers
		this._handleClick = this._handleClick.bind(this);
	}

	connectedCallback() {
		requestAnimationFrame(() => {
			// Upgrade properties that may have been set before the element was defined
			this._upgradeProperty('type');

			// Determine if inline
			this._internals.isInline = this.hasAttribute('inline');

			// Capture the original content and its computed styles
			this._captureOriginalContent();

			this.render();
		});
	}

	disconnectedCallback() {
		// Clean up event listeners
		const button = this.shadowRoot?.querySelector('button');
		if (button) {
			button.removeEventListener('click', this._handleClick);
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}

		switch (name) {
			case 'type':
				// Update the warning message
				if (this._internals.isRendered && !this._internals.revealed) {
					this._updateWarningMessage();
				}
				break;
		}
	}

	/**
	 * Capture the original content before replacing it with the warning
	 * @private
	 */
	_captureOriginalContent() {
		// Get all child nodes (including text nodes)
		this._internals.originalContent = Array.from(this.childNodes);

		// Measure dimensions if we have element children
		const firstElement = this.querySelector('*');
		if (firstElement) {
			this._internals.computedStyles =
				window.getComputedStyle(firstElement);
		}
	}

	/**
	 * Upgrade a property to handle cases where it was set before the element upgraded.
	 * This is especially important for framework compatibility.
	 * @param {string} prop - Property name to upgrade
	 * @private
	 */
	_upgradeProperty(prop) {
		if (Object.prototype.hasOwnProperty.call(this, prop)) {
			const value = this[prop];
			delete this[prop];
			this[prop] = value;
		}
	}

	/**
	 * Type attribute as a property.
	 * Reflects between property and attribute to keep them in sync.
	 */
	get type() {
		return this.getAttribute('type');
	}

	set type(value) {
		if (value === null || value === undefined) {
			this.removeAttribute('type');
		} else {
			this.setAttribute('type', value);
		}
	}

	/**
	 * Check if the content has been revealed
	 */
	get revealed() {
		return this._internals.revealed;
	}

	/**
	 * Handle click events to reveal content
	 * @private
	 */
	_handleClick(e) {
		if (!this._internals.revealed) {
			this._reveal();
		}
	}

	/**
	 * Reveal the content
	 * @private
	 */
	_reveal() {
		this._internals.revealed = true;

		// Clear the shadow DOM
		this.shadowRoot.innerHTML = '';

		// Restore original content to light DOM
		this.innerHTML = '';
		this._internals.originalContent.forEach((node) => {
			this.appendChild(node.cloneNode(true));
		});

		// Set role for accessibility
		this.setAttribute('role', 'alert');

		// Dispatch revealed event
		this.dispatchEvent(
			new CustomEvent('content-warning:revealed', {
				detail: { type: this.type },
				bubbles: true,
				composed: true,
			}),
		);

		// Focus the content
		this.focus();
	}

	/**
	 * Update the warning message in the button
	 * @private
	 */
	_updateWarningMessage() {
		const button = this.shadowRoot.querySelector('button');
		if (button) {
			const types = this.type || 'content';
			button.textContent = `Content Warning: ${types}. Click to reveal.`;
		}
	}

	/**
	 * Inherit styles from the original content
	 * @private
	 */
	_inheritStyles() {
		const wrapper = this.shadowRoot.querySelector('.wrapper');
		const button = this.shadowRoot.querySelector('button');

		if (!wrapper || !button) return;

		const styles = this._internals.computedStyles;

		// For block-level or image elements
		if (!this._internals.isInline && styles) {
			const display = styles.display;
			if (display !== 'inline') {
				// Inherit dimensions and margins
				['display', 'width', 'height', 'margin'].forEach((property) => {
					wrapper.style[property] = styles[property];
				});

				// Handle margin edge case
				if (styles.margin === '0px') {
					const firstChild = this._internals.originalContent.find(
						(n) => n.nodeType === 1,
					);
					if (firstChild) {
						const childStyles = window.getComputedStyle(firstChild);
						wrapper.style.marginBlockStart =
							childStyles.marginBlockStart;
						wrapper.style.marginBlockEnd =
							childStyles.marginBlockEnd;
					}
				}

				button.classList.add('block');
			}
		}
		// For inline elements, measure the content size
		else if (this._internals.isInline) {
			// Create a temporary measurement element
			const temp = document.createElement('span');
			temp.style.visibility = 'hidden';
			temp.style.position = 'absolute';
			this._internals.originalContent.forEach((node) => {
				temp.appendChild(node.cloneNode(true));
			});
			document.body.appendChild(temp);

			button.style.blockSize = `${temp.offsetHeight}px`;
			button.style.inlineSize = `${temp.offsetWidth}px`;

			document.body.removeChild(temp);
		}
	}

	render() {
		const types = this.type || 'content';

		// Build the shadow DOM with wrapper, button, and blurred content
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					position: relative;
				}

				:host([inline]) {
					display: inline;
				}

				:host([hidden]) {
					display: none;
				}

				.wrapper {
					background: var(--content-warning-bg, #ebebeb);
					position: relative;
				}

				:host([inline]) .wrapper {
					display: inline-block;
				}

				button {
					display: inline;
					text-align: center;
					cursor: pointer;
					align-items: center;
					justify-content: center;
					margin: 0;
					background: var(--content-warning-bg, rgba(0, 0, 0, 0.9));
					color: var(--content-warning-color, #fff);
					border: var(--content-warning-border, 2px solid currentColor);
					padding: var(--content-warning-padding, 0.25rem 0.5rem);
					font-size: var(--content-warning-font-size, 1rem);
					font-family: inherit;
					box-sizing: border-box;
				}

				button.block {
					display: flex;
					flex-direction: column;
					position: absolute;
					inset: 0;
					padding: var(--content-warning-padding, 1rem);
				}

				button:hover {
					opacity: 0.95;
				}

				button:focus-visible {
					outline: 2px solid var(--content-warning-color, #fff);
					outline-offset: -4px;
				}

				.content-blur {
					filter: blur(10px);
					user-select: none;
					pointer-events: none;
				}

				:host([inline]) .content-blur {
					display: none;
				}
			</style>
			<span class="wrapper">
				<button part="button">Content Warning: ${types}. Click to reveal.</button>
				<div class="content-blur"><slot></slot></div>
			</span>
		`;

		// Add event listener to button
		const button = this.shadowRoot.querySelector('button');
		if (button) {
			button.addEventListener('click', this._handleClick);
		}

		// Inherit styles from original content
		requestAnimationFrame(() => {
			this._inheritStyles();
		});

		this._internals.isRendered = true;
	}
}
