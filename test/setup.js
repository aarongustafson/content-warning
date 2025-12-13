import { beforeAll } from 'vitest';
import { ContentWarningElement } from '../content-warning.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('content-warning')) {
		customElements.define('content-warning', ContentWarningElement);
	}

	// Make the class available globally for testing static methods
	globalThis.ContentWarningElement = ContentWarningElement;
});
