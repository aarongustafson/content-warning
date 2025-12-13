/**
 * ContentWarningElement - A web component for block and inline content warnings.
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
		};
		
		// Bind event handlers
		this._handleClick = this._handleClick.bind(this);
		this._handleKeydown = this._handleKeydown.bind(this);
	}

	connectedCallback() {
		requestAnimationFrame(() => {
			// Upgrade properties that may have been set before the element was defined
			this._upgradeProperty('type');

			// Set up accessibility
			if (!this.hasAttribute('role')) {
				this.setAttribute('role', 'button');
			}
			if (!this.hasAttribute('tabindex') && !this._internals.revealed) {
				this.setAttribute('tabindex', '0');
			}
			if (!this.hasAttribute('aria-label')) {
				const types = this.type || 'content';
				this.setAttribute('aria-label', `Click to reveal ${types} warning`);
			}

			this.render();
			
			// Add event listeners only if not revealed
			if (!this._internals.revealed) {
				this.addEventListener('click', this._handleClick);
				this.addEventListener('keydown', this._handleKeydown);
			}
		});
	}

	disconnectedCallback() {
		// Clean up event listeners
		this.removeEventListener('click', this._handleClick);
		this.removeEventListener('keydown', this._handleKeydown);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}

		switch (name) {
			case 'type':
				// Update aria-label when type changes
				if (this._internals.isRendered && !this._internals.revealed) {
					const types = newValue || 'content';
					this.setAttribute('aria-label', `Click to reveal ${types} warning`);
					// Update the warning message
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
	 * Handle keydown events (Enter key) to reveal content
	 * @private
	 */
	_handleKeydown(e) {
		if (!this._internals.revealed && e.key === 'Enter') {
			this._reveal();
		}
	}

	/**
	 * Reveal the content
	 * @private
	 */
	_reveal() {
		this._internals.revealed = true;
		this.removeAttribute('tabindex');
		this.removeAttribute('role');
		
		// Update the overlay visibility
		const overlay = this.shadowRoot.querySelector('.content-warning-overlay');
		if (overlay) {
			overlay.style.display = 'none';
		}

		// Remove event listeners
		this.removeEventListener('click', this._handleClick);
		this.removeEventListener('keydown', this._handleKeydown);

		// Dispatch revealed event
		this.dispatchEvent(new CustomEvent('content-warning:revealed', {
			detail: { type: this.type },
			bubbles: true,
			composed: true
		}));
	}

	/**
	 * Update the warning message in the overlay
	 * @private
	 */
	_updateWarningMessage() {
		const message = this.shadowRoot.querySelector('.content-warning-message');
		if (message) {
			const types = this.type || 'content';
			message.textContent = `Content Warning: ${types}`;
		}
	}

	render() {
		const types = this.type || 'content';
		
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					position: relative;
				}

				/* Support inline display */
				:host([inline]) {
					display: inline;
				}

				/* Support the hidden attribute properly */
				:host([hidden]) {
					display: none;
				}

				.content-warning-overlay {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: var(--content-warning-bg, rgba(0, 0, 0, 0.9));
					color: var(--content-warning-color, #fff);
					border: var(--content-warning-border, 2px solid currentColor);
					padding: var(--content-warning-padding, 1rem);
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					text-align: center;
					cursor: pointer;
					z-index: 1;
					box-sizing: border-box;
				}

				:host([inline]) .content-warning-overlay {
					position: static;
					display: inline-flex;
					padding: 0.25rem 0.5rem;
					font-size: var(--content-warning-font-size, 0.875rem);
				}

				.content-warning-message {
					font-size: var(--content-warning-font-size, 1rem);
					font-weight: bold;
					margin-bottom: 0.5rem;
				}

				:host([inline]) .content-warning-message {
					margin-bottom: 0;
				}

				.content-warning-instruction {
					font-size: 0.875em;
					opacity: 0.9;
				}

				:host([inline]) .content-warning-instruction {
					display: none;
				}

				.content-warning-overlay:hover {
					opacity: 0.95;
				}

				.content-warning-overlay:focus-visible {
					outline: 2px solid var(--content-warning-color, #fff);
					outline-offset: -4px;
				}

				/* Hide slot content initially by making it invisible */
				::slotted(*) {
					filter: blur(10px);
					user-select: none;
					pointer-events: none;
				}

				:host([inline]) ::slotted(*) {
					visibility: hidden;
					width: 0;
					height: 0;
					overflow: hidden;
				}
			</style>
			<div class="content-warning-overlay" part="overlay">
				<div class="content-warning-message" part="message">Content Warning: ${types}</div>
				<div class="content-warning-instruction" part="instruction">Click or press Enter to reveal</div>
			</div>
			<slot></slot>
		`;

		this._internals.isRendered = true;
	}
}
