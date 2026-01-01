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
 * @attr {boolean} blur - Use blur visual effect instead of complete hiding (NOT Reader Mode safe)
 *
 * @cssproperty [--content-warning-color] - Outline color for focus state
 * @cssproperty [--content-warning-blur-amount] - Amount of blur in blur mode (default: 10px)
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
	/**
	 * Inject CSS to hide content-warning elements before they're defined.
	 * This prevents Reader Mode from extracting content before JS runs.
	 * @private
	 */
	static _injectPreDefinitionStyles() {
		const styleId = 'content-warning-pre-definition';
		if (!document.getElementById(styleId)) {
			const style = document.createElement('style');
			style.id = styleId;
			style.textContent = `
				content-warning:not(:defined) {
					display: none !important;
				}
			`;
			document.head.appendChild(style);
		}
	}

	// Static initialization block - runs when class is defined
	static {
		this._injectPreDefinitionStyles();
	}

	static #cssTemplate = `
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
		:host([inline]:not([revealed])) .content-wrapper {
			display: none;
		}
		.content-wrapper {
			display: contents;
		}
		/* Blur mode: visually obscured but present in DOM */
		:host(:not([revealed])[blur]) .content-wrapper ::slotted(*) {
			filter: blur(var(--content-warning-blur-amount, 10px));
			user-select: none;
			pointer-events: none;
		}
		/* Screen reader announcement - visually hidden */
		.sr-announcement {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border-width: 0;
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
		:host(:not([revealed])[blur]) .overlay {
				background: transparent;
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
	`;

	static get observedAttributes() {
		return ['type', 'label-prefix', 'label-suffix', 'blur'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = {
			isRendered: false,
			revealed: false,
			isInline: false,
		};

		// Cached DOM references (set after render)
		this._refs = {
			overlay: null,
			button: null,
			wrapper: null,
			announcement: null,
			slot: null,
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
		// Clean up event listener
		if (this._refs.overlay) {
			this._refs.overlay.removeEventListener('click', this._handleClick);
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
			case 'blur':
				// Update hiding mechanism when blur mode changes
				if (this._internals.isRendered && !this._internals.revealed) {
					this._updateContentHiding();
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

		// Remove hiding attributes from wrapper
		if (this._refs.wrapper) {
			this._refs.wrapper.removeAttribute('hidden');
			this._refs.wrapper.removeAttribute('inert');
			this._refs.wrapper.removeAttribute('aria-hidden');
		}

		// Announce content to screen readers
		this._announceReveal();

		// Remove the overlay (which contains the button)
		if (this._refs.overlay) {
			this._refs.overlay.remove();
			this._refs.overlay = null;
			this._refs.button = null;
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
		if (!this._refs.button) return;

		const prefix = this.labelPrefix || 'Content Warning';
		const types = this.type || 'content';
		const suffix =
			this.labelSuffix !== null && this.labelSuffix !== 'false'
				? this.labelSuffix || 'Click to reveal'
				: null;

		// Clear existing content
		this._refs.button.innerHTML = '';

		// Add prefix
		const prefixSpan = document.createElement('span');
		prefixSpan.setAttribute('part', 'label-prefix');
		prefixSpan.classList.add('label-prefix');
		prefixSpan.textContent = prefix;
		this._refs.button.appendChild(prefixSpan);

		// Add type
		const typeSpan = document.createElement('span');
		typeSpan.setAttribute('part', 'label-type');
		typeSpan.textContent = types;
		this._refs.button.appendChild(typeSpan);

		// Add suffix if present
		if (suffix) {
			const suffixSpan = document.createElement('span');
			suffixSpan.setAttribute('part', 'label-suffix');
			suffixSpan.textContent = suffix;
			this._refs.button.appendChild(suffixSpan);
		}
	}

	/**
	 * Update content hiding based on blur mode
	 * @private
	 */
	_updateContentHiding() {
		if (!this._refs.wrapper) return;

		const isBlurMode = this.hasAttribute('blur');

		// Remove all hiding attributes first
		this._refs.wrapper.removeAttribute('hidden');
		this._refs.wrapper.removeAttribute('inert');
		this._refs.wrapper.removeAttribute('aria-hidden');

		// Apply appropriate hiding for current mode
		if (isBlurMode) {
			this._refs.wrapper.setAttribute('aria-hidden', 'true');
		} else {
			this._refs.wrapper.setAttribute('hidden', '');
			this._refs.wrapper.setAttribute('inert', '');
		}
	}

	/**
	 * Announce revealed content to screen readers
	 * @private
	 */
	_announceReveal() {
		if (!this._refs.announcement || !this._refs.slot) return;

		// Clone slotted content into announcement region
		const slottedElements = this._refs.slot.assignedElements({
			flatten: true,
		});

		// Clear previous content
		this._refs.announcement.innerHTML = '';

		// Clone each slotted element
		slottedElements.forEach((el) => {
			this._refs.announcement.appendChild(el.cloneNode(true));
		});

		// Note: No cleanup timer - content remains for screen reader users
		// who may navigate to it later
	}

	render() {
		const prefix = this.labelPrefix || 'Content Warning';
		const types = this.type || 'content';
		const suffix = this.labelSuffix;
		const showSuffix = suffix !== 'false';

		// Build button label HTML
		const suffixText = suffix || 'Click to reveal';
		const buttonLabel = `<span class="label-prefix" part="label-prefix">${prefix}</span><span part="label-type">${types}</span>${showSuffix ? `<span part="label-suffix">${suffixText}</span>` : ''}`;

		// Build the shadow DOM
		this.shadowRoot.innerHTML = `
		<style>${ContentWarningElement.#cssTemplate}</style>
		<div part="overlay" class="overlay">
			<button part="button">${buttonLabel}</button>
		</div>
		<div class="content-wrapper">
			<slot></slot>
		</div>
		<div role="alert" aria-live="assertive" class="sr-announcement"></div>
	`;

		// Cache DOM references
		this._refs.overlay = this.shadowRoot.querySelector('.overlay');
		this._refs.button = this.shadowRoot.querySelector('button');
		this._refs.wrapper = this.shadowRoot.querySelector('.content-wrapper');
		this._refs.announcement =
			this.shadowRoot.querySelector('.sr-announcement');
		this._refs.slot = this.shadowRoot.querySelector('slot');

		// Add event listener to overlay
		if (this._refs.overlay) {
			this._refs.overlay.addEventListener('click', this._handleClick);
		}

		// Apply initial content hiding
		this._updateContentHiding();

		this._internals.isRendered = true;
	}
}
