// Opt-in experiment; promote through the starter before sharing with other demos.
const controls = document.getElementById('demo-tabs-controls');
const button = controls.querySelector('button');
const status = document.getElementById('demo-tabs-status');
const storageKey = 'web-component-demo-tabs';
const messages = {
	preference: status.dataset.preferenceFailureMessage,
	code: controls.dataset.codeLabel,
	live: controls.dataset.liveLabel,
	on: controls.dataset.onLabel,
	off: controls.dataset.offLabel,
};
for (const [name, message] of Object.entries(messages)) {
	if (!message?.trim()) {
		throw new Error(`Missing authored demo tabs message: ${name}`);
	}
}

function reportPreferenceFailure(error) {
	console.error('Demo tabs preference could not be saved or read:', error);
	status.textContent = messages.preference;
	status.hidden = false;
}

function readPreference() {
	const value = localStorage.getItem(storageKey);
	if (value === null) return null;
	if (!['on', 'off'].includes(value)) {
		throw new Error('Unrecognized demo tabs preference.');
	}
	return value === 'on';
}

let enabled = true;
try {
	enabled = readPreference() ?? true;
} catch (error) {
	reportPreferenceFailure(error);
}

const examples = [...document.querySelectorAll('.code-demo-pair')].map(
	(pair) => {
		const code = pair.querySelector(':scope > micro-lighter');
		const live = pair.querySelector(':scope > .demo');
		const heading = pair.parentElement.querySelector(
			':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5',
		);
		if (!code || !live || !heading) {
			throw new Error(
				'Demo tabs require a heading and a code/live pair.',
			);
		}
		return { pair, code, live, heading, tabs: null, activeIndex: 1 };
	},
);

await Promise.all([
	new Promise((resolve, reject) => {
		const stylesheet = document.createElement('link');
		stylesheet.rel = 'stylesheet';
		stylesheet.href = new URL('./tabs-prototype.css', import.meta.url);
		stylesheet.addEventListener('load', resolve, { once: true });
		stylesheet.addEventListener(
			'error',
			() => {
				stylesheet.remove();
				reject(new Error('Demo tabs stylesheet unavailable.'));
			},
			{ once: true },
		);
		document.head.append(stylesheet);
	}),
	import('https://cdn.jsdelivr.net/npm/@aarongustafson/tabbed-interface@3.0.4/define.js'),
]);

function setEnabled(value) {
	for (const example of examples) {
		const { pair, code, live, heading } = example;
		if (value) {
			const tabs = document.createElement('tabbed-interface');
			tabs.setAttribute('default-tab', String(example.activeIndex));
			tabs.dataset.demoTabsPanel =
				example.activeIndex === 0 ? 'code' : 'live';
			tabs.addEventListener('tabbed-interface:change', (event) => {
				if (event.target === tabs) {
					tabs.dataset.demoTabsPanel =
						event.detail.tabIndex === 0 ? 'code' : 'live';
				}
			});
			tabs.setAttribute('role', 'group');
			tabs.setAttribute('aria-label', heading.textContent.trim());
			const level = Math.min(6, Number(heading.tagName.slice(1)) + 1);
			const codeHeading = document.createElement(`h${level}`);
			codeHeading.textContent = messages.code;
			const liveHeading = document.createElement(`h${level}`);
			liveHeading.textContent = messages.live;
			tabs.append(codeHeading, code, liveHeading, live);
			pair.replaceChildren(tabs);
			pair.dataset.demoTabsActive = '';
			example.tabs = tabs;
		} else if (example.tabs) {
			example.activeIndex = example.tabs.activeIndex;
			pair.replaceChildren(code, live);
			delete pair.dataset.demoTabsActive;
			example.tabs = null;
		}
	}
	enabled = value;
	button.setAttribute('aria-pressed', String(value));
	button.querySelector('[data-tabs-state]').textContent = value
		? messages.on
		: messages.off;
}

setEnabled(enabled);
controls.hidden = false;
button.addEventListener('click', () => {
	setEnabled(!enabled);
	try {
		localStorage.setItem(storageKey, enabled ? 'on' : 'off');
		if (readPreference() !== enabled) {
			throw new Error('Browser did not retain the demo tabs preference.');
		}
		status.textContent = '';
		status.hidden = true;
	} catch (error) {
		reportPreferenceFailure(error);
	}
});
