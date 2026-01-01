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
<script
  src="./node_modules/@aarongustafson/content-warning/define.js"
  type="module"
></script>
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

## Reader Mode Safety

**Important:** Reader Mode parsers (Edge Immersive Reader, Safari Reader, etc.) extract content **before JavaScript runs**. To ensure content is hidden from Reader Mode, the component automatically injects CSS to hide `<content-warning>` elements before they're defined:

```css
content-warning:not(:defined) {
  display: none !important;
}
```

This style is automatically injected when you import the component. If you're manually defining the element or need to add this style yourself, include it in your page's `<head>`:

```html
<style>
  content-warning:not(:defined) {
    display: none !important;
  }
</style>
```

**How it works:**
1. Before JS runs: Elements are hidden (Reader Mode can't extract them)
2. After custom element definition: Elements become `:defined` and display normally
3. Component takes over with Shadow DOM hiding logic

## Content Hiding Modes

The component offers two modes for hiding content, each with different trade-offs:

### Default Mode (Recommended)

**Reader Mode Safe** - Content is truly hidden from Reader Mode and screen readers until revealed.

```html
<content-warning type="sensitive content">
  <p>This content is completely hidden until revealed.</p>
</content-warning>
```

- Uses `hidden` and `inert` attributes on the content wrapper
- Content is **not** extracted by Reader Mode (Edge, Safari, etc.)
- Content is hidden from screen readers via native attributes
- Best for sensitive content that should be truly hidden

### Blur Mode

**Visual Only** - Content is visually obscured but still present in the DOM.

```html
<content-warning type="spoilers" blur>
  <p>This content is blurred but technically visible in the DOM.</p>
</content-warning>
```

- Uses CSS `filter: blur()` to obscure content visually
- Uses `aria-hidden="true"` to hide from screen readers
- Content **may be** extracted by Reader Mode (not guaranteed to be hidden)
- Customizable blur amount via `--content-warning-blur-amount` CSS property
- Best for aesthetic preference when complete hiding isn't critical

**Trade-off Summary:**

- **Without `blur`**: Maximum safety and hiding (recommended for sensitive content)
- **With `blur`**: Visual obscuring effect (not fully hidden from all contexts)

## Attributes

| Attribute      | Type      | Default             | Description                                                            |
| -------------- | --------- | ------------------- | ---------------------------------------------------------------------- |
| `type`         | `string`  | `"content"`         | Space-separated list of warning types (e.g., "violence spoilers nsfw") |
| `label-prefix` | `string`  | `"Content Warning"` | The prefix text for the warning label                                  |
| `label-suffix` | `string`  | `"Click to reveal"` | The suffix text for the warning label. Set to `"false"` to hide.       |
| `inline`       | `boolean` | `false`             | Display the warning inline instead of as a block overlay               |
| `blur`         | `boolean` | `false`             | Use blur visual effect instead of complete hiding (NOT Reader Mode safe) |

**Default Button Label Format:** `{prefix}: {type} {suffix}`

Example: "Content Warning: violence spoilers Click to reveal"

**Note:** Punctuation and spacing between label parts are controlled via CSS pseudo-elements (`:after` and `:before`), making them easy to customize without affecting the underlying text content.

## Events

The component fires custom events that you can listen to:

| Event                      | Description                                                    | Detail                                           |
| -------------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
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

| Property      | Type                  | Description                                   |
| ------------- | --------------------- | --------------------------------------------- |
| `type`        | `string`              | Get/set the warning type(s)                   |
| `labelPrefix` | `string`              | Get/set the prefix text for the warning label |
| `labelSuffix` | `string`              | Get/set the suffix text for the warning label |
| `revealed`    | `boolean` (read-only) | Whether the content has been revealed         |

## CSS Custom Properties

Customize the component's appearance with CSS variables:

| Property                          | Default | Description                                   |
| --------------------------------- | ------- | --------------------------------------------- |
| `--content-warning-color`         | `#fff`  | Outline color for focus state                 |
| `--content-warning-blur-amount`   | `10px`  | Amount of blur in blur mode (e.g., `5px`, `20px`) |

### Example

```css
content-warning {
  --content-warning-color: #ff6b6b;
  --content-warning-blur-amount: 15px;
}
```

## Shadow Parts

You can style internal elements using CSS Shadow Parts:

| Part           | Description                                       |
| -------------- | ------------------------------------------------- |
| `overlay`      | The full-area overlay div that covers the content |
| `button`       | The warning button element inside the overlay     |
| `label-prefix` | The prefix text span (e.g., "Content Warning")    |

### Example Styling

```css
/* Style the full-area overlay */
content-warning::part(overlay) {
  background: rgba(139, 0, 0, 0.95);
}

/* Style the button inside the overlay */
content-warning::part(button) {
  color: #fff;
  border: 3px solid #ff6b6b;
  padding: 2rem;
  font-size: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0.5rem;
}

/* Style individual label parts */
content-warning::part(label-prefix) {
  font-weight: bold;
}

content-warning::part(label-type) {
  font-style: italic;
  color: #ff6b6b;
}

content-warning::part(label-suffix) {
  font-size: 0.875em;
  opacity: 0.9;
}

/* Style inline warnings differently */
content-warning[inline]::part(overlay) {
  background: #333;
}

content-warning[inline]::part(button) {
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
}
```

## Internationalization (i18n)

Customize the button label for different languages using `label-prefix` and `label-suffix` attributes:

```html
<!-- Spanish -->
<content-warning
  type="violencia gore"
  label-prefix="Advertencia de Contenido"
  label-suffix="Haz clic para revelar"
>
  <img src="image.jpg" alt="Sensitive image" />
</content-warning>

<!-- French -->
<content-warning
  type="contenu sensible"
  label-prefix="Avertissement"
  label-suffix="Cliquez pour révéler"
>
  <p>Contenu en français...</p>
</content-warning>

<!-- No suffix -->
<content-warning type="graphic content" label-suffix="false">
  <p>Content without suffix text</p>
</content-warning>
```

Style each label part individually:

````css
content-warning::part(label-prefix) {
  font-weight: bold;
}

content-warning::part(label-type) {
  font-style: italic;
  color: #ff6b6b;
}

content-warning::part(label-suffix) {
  font-size: 0.875em;
  opacity: 0.9;
}
```

### Customizing Punctuation

Punctuation and spacing between label parts are controlled via CSS pseudo-elements:

```css
/* Default punctuation (already applied) */
.label-prefix::after {
  content: ": "; /* Colon and space after prefix */
}

[part="label-type"]::before {
  content: " "; /* Space before type */
}

[part="label-suffix"]::before {
  content: " "; /* Space before suffix */
}

/* Customize punctuation */
content-warning::part(button) .label-prefix::after {
  content: " — "; /* Em dash instead of colon */
}

/* Remove punctuation entirely */
content-warning::part(button) .label-prefix::after {
  content: " "; /* Just a space */
}
```adding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
}
````

## Accessibility

The component follows accessibility best practices:

- Uses a semantic `<button>` element for the warning interaction
- Button is keyboard accessible by default
- Content is hidden from screen readers until revealed (both modes use `aria-hidden` or `hidden` attribute)
- **Default mode**: Uses `hidden` + `inert` attributes (Reader Mode safe)
- **Blur mode**: Uses `aria-hidden="true"` (visual obscuring only)
- Sets `role="alert"` on the host element when content is revealed
- Clones revealed content into a persistent `role="alert"` region for screen reader announcement
- Screen readers announce the revealed content automatically
- Focuses the revealed content for additional context

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
