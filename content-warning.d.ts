/**
 * ContentWarningElement - A web component for block and inline content warnings
 *
 * @element content-warning
 *
 * @attr {string} type - Space-separated list of warning types (e.g., "violence spoilers")
 * @attr {string} reveal-label - Complete label template supporting {type}.
 * @attr {string} type-label - Fallback type text for an absent or empty type.
 * @attr {boolean} inline - Display the warning inline instead of as a block overlay
 *
 * @fires content-warning:revealed - Fired when the content is revealed by the user
 *
 * @slot - Default slot for the content that needs a warning
 *
 * @cssprop --content-warning-color - Focus outline color (default: currentColor).
 * @cssprop --content-warning-blur-amount - Blur amount in blur mode (default: 10px).
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

	/** Authored template override; null means use legacy or shared/default labels. */
	get revealLabel(): string | null;
	set revealLabel(value: string | null | undefined);

	/** Authored fallback type override; null means use shared/default text. */
	get typeLabel(): string | null;
	set typeLabel(value: string | null | undefined);

	/** @deprecated Use revealLabel for a complete phrase. */
	get labelPrefix(): string | null;
	set labelPrefix(value: string | null | undefined);

	/** @deprecated Use revealLabel; omit suffix text from the template. */
	get labelSuffix(): string | null;
	set labelSuffix(value: string | null | undefined);

	/**
	 * Check if the content has been revealed
	 */
	get revealed(): boolean;

	/**
	 * Reveal the content
	 * @private
	 */
	private _reveal(): void;

	/**
	 * Update the warning message in the overlay
	 * @private
	 */
	private _updateWarningMessage(initial?: boolean): void;

	/**
	 * Update connected, initialized labels in place; true is a no-op after reveal.
	 * Logs configuration failures and returns false without replacing existing text.
	 * Changes to shared JSON require an explicit call on each affected instance.
	 */
	refresh(): boolean;

	/**
	 * Initializes shadow content once, or refreshes labels. Never conceals revealed content.
	 */
	render(): void;

	addEventListener<K extends keyof ContentWarningEventMap>(
		type: K,
		listener: (
			this: ContentWarningElement,
			event: ContentWarningEventMap[K],
		) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions,
	): void;
	removeEventListener<K extends keyof ContentWarningEventMap>(
		type: K,
		listener: (
			this: ContentWarningElement,
			event: ContentWarningEventMap[K],
		) => void,
		options?: boolean | EventListenerOptions,
	): void;
	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | EventListenerOptions,
	): void;
}

/** Partial, page-level authored defaults; no built-in locale catalog or named scopes. */
export interface ContentWarningLabels {
	'reveal-label'?: string;
	'type-label'?: string;
}

export interface ContentWarningEventMap extends HTMLElementEventMap {
	'content-warning:revealed': ContentWarningRevealedEvent;
}

/**
 * Event detail for content-warning:revealed event
 */
export interface ContentWarningRevealedEvent extends CustomEvent {
	detail: {
		type: string | null;
	};
}

declare global {
	interface HTMLElementTagNameMap {
		'content-warning': ContentWarningElement;
	}
}
