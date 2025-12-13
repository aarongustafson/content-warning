/**
 * ContentWarningElement - A web component for block and inline content warnings
 *
 * @element content-warning
 *
 * @attr {string} type - Space-separated list of warning types (e.g., "violence spoilers")
 * @attr {boolean} inline - Display the warning inline instead of as a block overlay
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
	/**
	 * List of attributes to observe for changes
	 */
	static readonly observedAttributes: string[];

	/**
	 * Internal state and flags
	 */
	private readonly _internals: {
		isRendered: boolean;
		revealed: boolean;
	};

	/**
	 * Event handler for click events
	 */
	private _handleClick: (e: MouseEvent) => void;

	/**
	 * Event handler for keydown events
	 */
	private _handleKeydown: (e: KeyboardEvent) => void;

	constructor();

	/**
	 * Called when the element is connected to the DOM
	 */
	connectedCallback(): void;

	/**
	 * Called when the element is disconnected from the DOM
	 */
	disconnectedCallback(): void;

	/**
	 * Called when an observed attribute changes
	 * @param name - The attribute name that changed
	 * @param oldValue - The previous value
	 * @param newValue - The new value
	 */
	attributeChangedCallback(
		name: string,
		oldValue: string | null,
		newValue: string | null,
	): void;

	/**
	 * Upgrade a property to handle cases where it was set before the element upgraded.
	 * This is especially important for framework compatibility.
	 * @param prop - Property name to upgrade
	 * @private
	 */
	private _upgradeProperty(prop: string): void;

	/**
	 * Type attribute as a property.
	 * Space-separated list of warning types.
	 */
	get type(): string | null;
	set type(value: string | null | undefined);

	/**
	 * Check if the content has been revealed
	 */
	get revealed(): boolean;

	/**
	 * Handle click events to reveal content
	 * @private
	 */
	private _handleClick(e: MouseEvent): void;

	/**
	 * Handle keydown events (Enter key) to reveal content
	 * @private
	 */
	private _handleKeydown(e: KeyboardEvent): void;

	/**
	 * Reveal the content
	 * @private
	 */
	private _reveal(): void;

	/**
	 * Update the warning message in the overlay
	 * @private
	 */
	private _updateWarningMessage(): void;

	/**
	 * Renders the component's shadow DOM content
	 */
	render(): void;
}

/**
 * Event detail for content-warning:revealed event
 */
export interface ContentWarningRevealedEvent extends CustomEvent {
	detail: {
		type: string | null;
	};
}
