# content-warning Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/content-warning.svg)](https://www.npmjs.com/package/@aarongustafson/content-warning) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/content-warning/ci.yml?branch=main)](https://github.com/aarongustafson/content-warning/actions)

A web component for block and inline content warnings.

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
<content-warning>
  <!-- Your content here -->
</content-warning>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `example-attribute` | `string` | `""` | Description of the attribute |

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `content-warning:event` | Fired when something happens | `{ data }` |

### Example Event Handling

```javascript
const element = document.querySelector('content-warning');

element.addEventListener('content-warning:event', (event) => {
  console.log('Event fired:', event.detail);
});
```

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--example-color` | `#000` | Example color property |

### Example Styling

```css
content-warning {
  --example-color: #ff0000;
}
```

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
