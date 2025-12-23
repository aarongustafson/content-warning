# content-warning Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/content-warning.svg)](https://www.npmjs.com/package/@aarongustafson/content-warning) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/content-warning/ci.yml?branch=main)](https://github.com/aarongustafson/content-warning/actions)

A web component for block and inline content warnings.

Based on the [original concept](https://codepen.io/aarongustafson/pen/QWZpqPe) by Aaron Gustafson.

## Demo

[Live Demo](https://aarongustafson.github.io/content-warning/demo/) ([Source](./demo/index.html))

Additional demos:
- [ESM CDN Demo](https://aarongustafson.github.io/content-warning/demo/esm.html) ([Source](./demo/esm.html))
- [Unpkg CDN Demo](https://aarongustafson.github.io/content-warning/demo/unpkg.html) ([Source](./demo/unpkg.html))

## Installation

```bash
npm install @aarongustafson/content-warning
```

## Usage

### Option 1: Auto-define the custom element (easiest)

Import the package to automatically define the `<content-warning>` custom element:

```javascript
import '@aarongustafson/content-warning';
```

Or use the define-only script in HTML:

```html
<script src="./node_modules/@aarongustafson/content-warning/define.js" type="module"></script>
```

### Option 2: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { ContentWarningElement } from '@aarongustafson/content-warning/content-warning.js';

customElements.define('my-custom-name', ContentWarningElement);
```

### Basic Example

```html
<!-- Block content warning -->
<content-warning type="violence spoilers">
  <p>This content contains violence and spoilers for the series finale.</p>
</content-warning>

<!-- Inline content warning -->
<p>
  The character dies in
  <content-warning type="spoilers" inline>episode 5</content-warning>.
</p>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `string` | `"content"` | Space-separated list of warning types (e.g., "violence spoilers nsfw") |
| `inline` | `boolean` | `false` | Display the warning inline instead of as a block overlay |

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `content-warning:revealed` | Fired when the user reveals the content by clicking the button | `{ type: string }` - The type of content warning |

### Example Event Handling

```javascript
const element = document.querySelector('content-warning');

element.addEventListener('content-warning:revealed', (event) => {
  console.log('Content revealed:', event.detail.type);
  // Track analytics, log user action, etc.
});
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | Get/set the warning type(s) |
| `revealed` | `boolean` (read-only) | Whether the content has been revealed |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--content-warning-bg` | `rgba(0, 0, 0, 0.9)` | Background color of the warning overlay |
| `--content-warning-color` | `#fff` | Text color of the warning message |
| `--content-warning-border` | `2px solid currentColor` | Border style for the warning |
| `--content-warning-padding` | `1rem` | Padding for the warning overlay |
| `--content-warning-font-size` | `1rem` | Font size for the warning message |

### Example Styling

```css
content-warning {
  --content-warning-bg: rgba(255, 0, 0, 0.8);
  --content-warning-color: #fff;
  --content-warning-border: 3px solid #fff;
  --content-warning-padding: 2rem;
  --content-warning-font-size: 1.25rem;
}
```

## Shadow Parts

You can style internal elements using CSS Shadow Parts:

| Part | Description |
|------|-------------|
| `button` | The warning button element |

```css
content-warning::part(button) {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

## Accessibility

The component follows accessibility best practices:

- Uses a semantic `<button>` element for the warning interaction
- Button is keyboard accessible by default
- Content is blurred and non-interactive until revealed (block display mode)
- Sets `role="alert"` on the host element when content is revealed
- Focuses the revealed content for screen reader announcement

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- Shadow DOM v1
- ES Modules

For older browsers, you may need polyfills.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# View demo
open demo/index.html
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
