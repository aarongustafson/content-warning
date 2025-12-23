/**
 * ContentWarningElement - A web component for block and inline content warnings.
 *
 * Based on the original concept: https://codepen.io/aarongustafson/pen/QWZpqPe
 *
 * @element content-warning
 *
 * @attr {string} type - Space-separated list of warning types (e.g., "violence spoilers")
 * @attr {string} label-prefix - The prefix text for the warning (default: "Content Warning")
 * @attr {string} label-suffix - The suffix text for the warning (default: "Click to reveal"). Set to "false" to hide.
 * @attr {boolean} inline - Display the warning inline instead of as a block overlay
 *
 * @cssproperty [--content-warning-color] - Outline color for focus state
 *
 * @description
 * Button label format: {prefix}: {type} {suffix}
 * Punctuation is controlled via CSS pseudo-elements for easy customization.
 *
 * @fires content-warning:revealed - Fired when the content is revealed by the user
 *
 * @slot - Default slot for the content that needs a warning
 *
 * @csspart button - The warning button element
 * @csspart overlay - The warning overlay (same element as button)
 * @csspart label-prefix - The prefix text span (e.g., "Content Warning")
 * @csspart label-type - The warning type text span (e.g., "violence spoilers")
 * @csspart label-suffix - The suffix text span (e.g., "Click to reveal")
 */
export class ContentWarningElement extends HTMLElement {
	static get observedAttributes() {
		return ['type', 'label-prefix', 'label-suffix'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = {
			isRendered: false,
			revealed: false,
			isInline: false,
		};

		// Bind event handlers
		this._handleClick = this._handleClick.bind(this);
	}

	connectedCallback() {
		requestAnimationFrame(() => {
			// Upgrade properties that may have been set before the element was defined
			this._upgradeProperty('type');
			this._upgradeProperty('labelPrefix');
			this._upgradeProperty('labelSuffix');

			// Determine if inline
			this._internals.isInline = this.hasAttribute('inline');

			this.render();
		});
	}

	disconnectedCallback() {
		// Clean up event listeners
		const overlay = this.shadowRoot?.querySelector('.overlay');
		const button = this.shadowRoot?.querySelector('button');
		if (overlay) {
			overlay.removeEventListener('click', this._handleClick);
		}
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
			case 'label-prefix':
			case 'label-suffix':
				// Update the warning message
				if (this._internals.isRendered && !this._internals.revealed) {
					this._updateWarningMessage();
				}
				break;
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
	 * Label prefix property.
	 * Reflects between property and attribute to keep them in sync.
	 */
	get labelPrefix() {
		return this.getAttribute('label-prefix');
	}

	set labelPrefix(value) {
		if (value === null || value === undefined) {
			this.removeAttribute('label-prefix');
		} else {
			this.setAttribute('label-prefix', value);
		}
	}

	/**
	 * Label suffix property.
	 * Reflects between property and attribute to keep them in sync.
	 */
	get labelSuffix() {
		return this.getAttribute('label-suffix');
	}

	set labelSuffix(value) {
		if (value === null || value === undefined) {
			this.removeAttribute('label-suffix');
		} else {
			this.setAttribute('label-suffix', value);
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

		// Remove the overlay (which contains the button)
		const overlay = this.shadowRoot.querySelector('.overlay');
		if (overlay) {
			overlay.remove();
		}

		// Mark as revealed for CSS
		this.setAttribute('revealed', '');

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
		if (!button) return;

		const prefix = this.labelPrefix || 'Content Warning';
		const types = this.type || 'content';
		const suffix =
			this.labelSuffix !== null && this.labelSuffix !== 'false'
				? this.labelSuffix || 'Click to reveal'
				: null;

		// Clear existing content
		button.innerHTML = '';

		// Add prefix
		const prefixSpan = document.createElement('span');
		prefixSpan.setAttribute('part', 'label-prefix');
		prefixSpan.classList.add('label-prefix');
		prefixSpan.textContent = prefix;
		button.appendChild(prefixSpan);

		// Add type
		const typeSpan = document.createElement('span');
		typeSpan.setAttribute('part', 'label-type');
		typeSpan.textContent = types;
		button.appendChild(typeSpan);

		// Add suffix if present
		if (suffix) {
			const suffixSpan = document.createElement('span');
			suffixSpan.setAttribute('part', 'label-suffix');
			suffixSpan.textContent = suffix;
			button.appendChild(suffixSpan);
		}
	}

	render() {
		const prefix = this.labelPrefix || 'Content Warning';
		const types = this.type || 'content';
		const suffix = this.labelSuffix;
		const showSuffix = suffix !== 'false';

		// Build button label HTML parts
		const prefixHTML =
			'<span class="label-prefix" part="label-prefix">' +
			prefix +
			'</span>';
		const typeHTML = '<span part="label-type">' + types + '</span>';
		let buttonLabel = prefixHTML + typeHTML;

		if (showSuffix) {
			const suffixText = suffix || 'Click to reveal';
			const suffixHTML =
				'<span part="label-suffix">' + suffixText + '</span>';
			buttonLabel += suffixHTML;
		}

		// Build the shadow DOM with just the button overlay
		// Light DOM content remains visible and defines dimensions
		this.shadowRoot.innerHTML = `
		<style>
			:host {
				display: block;
				position: relative;
			}
			:host([inline]) {
				display: inline-block;
				vertical-align: baseline;
			}
			:host([hidden]) {
				display: none;
			}
			:host(:not([revealed])) ::slotted(*) {
				filter: blur(10px);
				user-select: none;
				pointer-events: none;
			}
			:host([inline]:not([revealed])) ::slotted(*) {
				visibility: hidden;
			}
			:host([inline]:not([revealed])) .content-slot {
				display: none;
			}
			.content-slot {
				display: contents;
			}
			.overlay {
				position: absolute;
				inset: 0;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				background: rgba(0, 0, 0, 0.9);
				cursor: pointer;
				z-index: 1;
			}
			@supports (backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px)) {
				.overlay {
					background: rgba(0, 0, 0, 0.5);
					backdrop-filter: blur(10px);
					-webkit-backdrop-filter: blur(10px);
				}
			}
			:host([inline]) .overlay {
				position: static;
				display: inline-flex;
			}
			button {
				cursor: pointer;
				margin: 0;
				background: transparent;
				color: #fff;
				border: 2px solid currentColor;
				padding: 1rem;
				font-size: 1rem;
				font-family: inherit;
				box-sizing: border-box;
				text-align: center;
			}
			:host([inline]) button {
				padding: 0.25rem 0.5rem;
				font-size: 0.875rem;
			}
			button:hover {
				opacity: 0.95;
			}
			button:focus-visible {
				outline: 2px solid var(--content-warning-color, #fff);
				outline-offset: -4px;
			}
			:is(.label-prefix)::after {
				content: ": ";
			}
			[part="label-type"]::before {
				content: " ";
			}
			[part="label-suffix"]::before {
				content: " ";
			}
		</style>
		<div part="overlay" class="overlay">
			<button part="button">${buttonLabel}</button>
		</div>
		<span class="content-slot"><slot></slot></span>
	`; // Add event listeners to overlay and button
		const overlay = this.shadowRoot.querySelector('.overlay');
		const button = this.shadowRoot.querySelector('button');
		if (overlay) {
			overlay.addEventListener('click', this._handleClick);
		}
		if (button) {
			button.addEventListener('click', this._handleClick);
		}

		this._internals.isRendered = true;
	}
}
