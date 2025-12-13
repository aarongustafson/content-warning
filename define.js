import { ContentWarningElement } from './content-warning.js';

export function defineComponentName(tagName = 'content-warning') {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, ContentWarningElement);
	}

	return true;
}

defineComponentName();
