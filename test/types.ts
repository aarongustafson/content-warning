import type {
	ContentWarningElement,
	ContentWarningRevealedEvent,
} from '@aarongustafson/content-warning';

const warning = document.createElement('content-warning');
const onReveal = function (
	this: ContentWarningElement,
	event: ContentWarningRevealedEvent,
) {
	const type: string | null = event.detail.type;
	console.log(this.revealed, type);
};

warning.addEventListener('content-warning:revealed', onReveal, { once: true });
warning.removeEventListener('content-warning:revealed', onReveal, {
	capture: false,
});
warning.removeEventListener('content-warning:revealed', function (event) {
	const type: string | null = event.detail.type;
	console.log(this.revealed, type);
});

warning.addEventListener('click', (event) => {
	const click: MouseEvent = event;
	console.log(click.clientX);
});
warning.removeEventListener('click', (event) => {
	const click: MouseEvent = event;
	console.log(click.clientX);
});
warning.removeEventListener('keydown', (event) => {
	const keydown: KeyboardEvent = event;
	console.log(keydown.key);
});

const eventName: string = 'application:event';
const listener: EventListenerObject = {
	handleEvent(event) {
		console.log(event.type);
	},
};
warning.addEventListener(eventName, listener, true);
warning.removeEventListener(eventName, listener, true);
warning.removeEventListener(eventName, null);
