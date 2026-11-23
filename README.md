# content-warning Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/content-warning.svg)](https://www.npmjs.com/package/@aarongustafson/content-warning)
[![CI status](https://img.shields.io/github/actions/workflow/status/aarongustafson/content-warning/ci.yml?branch=main&label=CI)](https://github.com/aarongustafson/content-warning/actions/workflows/ci.yml)
[![Minified + gzipped size](https://img.shields.io/bundlejs/size/@aarongustafson/content-warning?format=minzip&label=min%2Bgzip)](https://bundlejs.com/?q=@aarongustafson/content-warning)
[![License](https://img.shields.io/npm/l/@aarongustafson/content-warning)](https://github.com/aarongustafson/content-warning/blob/main/LICENSE)
[![Type definitions](https://img.shields.io/npm/types/@aarongustafson/content-warning)](https://github.com/aarongustafson/content-warning/blob/main/content-warning.d.ts)

`<content-warning>` adds a reveal button to block or inline content. Without
JavaScript, its contents remain visible unless you author `hidden` on the
element. Hidden content stays hidden if the component can’t load.

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

### Option 1: Auto-define the custom element

Import the registration entry point to define the `<content-warning>` custom element:

```javascript
import '@aarongustafson/content-warning/define.js';
```

Or use the define-only script in HTML:

```html
<script
  src="./node_modules/@aarongustafson/content-warning/define.js"
  type="module"
></script>
```

### Option 2: Import the class and define manually

The package root and class file are class-only imports; neither registers an element.

Import the class and define the custom element with your preferred tag name:

```javascript
import { ContentWarningElement } from '@aarongustafson/content-warning/content-warning.js';

customElements.define('my-custom-name', ContentWarningElement);
```

### Basic Example

```html
<!-- Block content warning -->
<content-warning type="violence spoilers" hidden>
  <p>This content contains violence and spoilers for the series finale.</p>
</content-warning>

<!-- Inline content warning -->
<p>
  The character dies in
  <content-warning type="spoilers" inline hidden>episode 5</content-warning>.
</p>
```

## Before JavaScript and in Reader Mode

Add the native [`hidden` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)
when content must not appear before the component loads or if JavaScript fails:

```html
<content-warning type="violence" hidden>
  <p>This content stays hidden without JavaScript.</p>
</content-warning>
```

Before upgrade, the browser hides the authored element. When the component
connects, it removes the host’s `hidden` attribute, then renders its warning on
the next animation frame. The enhanced hiding mode below takes over after render;
this isn’t a guarantee of uninterrupted hiding during initialization.

Reader Mode tools may extract the page before or after JavaScript runs and may
handle hidden or shadow content differently. Authored `hidden` helps tools that
honor native hidden content, but neither mode guarantees exclusion from every
Reader Mode. Test the browsers and reading tools your audience uses.

Without authored `hidden`, the contents are ordinary visible HTML before upgrade
and when JavaScript fails. A warning is not an access-control or privacy boundary:
the content remains in the document and can be inspected or extracted.

## Content Hiding Modes

The component offers two modes for hiding content, each with different trade-offs:

### Default Mode

After render, the component applies `hidden` and `inert` to its shadow content
wrapper. `inert` prevents interaction and excludes the contents from the
accessibility tree until reveal.

The current stylesheet sets the wrapper to `display: contents`, overriding
the native `hidden` display rule for block warnings. Their content keeps its
layout beneath a dark, translucent overlay; don’t rely on enhanced `hidden` alone to
remove it from rendering or extraction. Inline warnings use `display: none`
on the unrevealed wrapper. Authored `hidden` on the host still hides the whole
element before upgrade and without JavaScript.

```html
<content-warning type="sensitive content" hidden>
  <p>This content is hidden until revealed.</p>
</content-warning>
```

### Blur Mode

Blur changes the enhanced presentation, not the pre-upgrade fallback.

```html
<content-warning type="spoilers" blur hidden>
  <p>This content is blurred but technically visible in the DOM.</p>
</content-warning>
```

- Uses CSS `filter: blur()` on slotted elements; bare text nodes aren’t blurred
- Uses `aria-hidden="true"` on the wrapper to exclude it from the accessibility tree
- Doesn’t use `inert`; CSS blocks pointer interaction with slotted elements, but
  authors must avoid focusable descendants that could remain in the keyboard order
- Inline warnings hide their wrapper with CSS, even with `blur`
- Reader Mode may extract the content
- Customizable blur amount via `--content-warning-blur-amount` CSS property
- Best for aesthetic preference when complete hiding isn't critical

**Trade-off Summary:**

- **Without `blur`**: A dark overlay and `inert` after render
- **With `blur`**: Visual obscuring, not a security boundary

## Attributes

| Attribute      | Type      | Default             | Description                                                            |
| -------------- | --------- | ------------------- | ---------------------------------------------------------------------- |
| `type`         | `string`  | `"content"`         | Space-separated list of warning types (e.g., "violence spoilers nsfw") |
| `label-prefix` | `string`  | `"Content Warning"` | The prefix text for the warning label                                  |
| `label-suffix` | `string`  | `"Click to reveal"` | The suffix text for the warning label. Set to `"false"` to hide.       |
| `inline`       | `boolean` | `false`             | Display the warning inline instead of as a block overlay               |
| `blur`         | `boolean` | `false`             | Blur slotted elements instead of using native hiding after render      |
| `hidden`       | `boolean` | `false`             | Native pre-upgrade hiding; removed when the component connects         |

**Default Button Label Format:** `{prefix}: {type} {suffix}`

Example: "Content Warning: violence spoilers Click to reveal"

Initial rendering uses “Click to reveal” when `label-suffix` is absent or empty.
After a label update, an absent suffix is omitted; an empty suffix uses the
default text. Use `label-suffix="false"` to omit it consistently.
Supply trusted plain text for labels and warning types: initial rendering
interpolates these attributes into HTML, so they must not contain untrusted input.

**Note:** Punctuation and spacing between label parts are controlled via CSS pseudo-elements (`:after` and `:before`), making them easy to customize without affecting the underlying text content.

## Events

The component fires custom events that you can listen to:

| Event                      | Description                                    | Detail                                                 |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `content-warning:revealed` | Fired once when the user activates the warning | `{ type: string \| null }` - The authored warning type |

The event bubbles and crosses shadow boundaries. A missing `type` attribute
produces `null` in the event detail even though the button displays “content.”

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

`type`, `labelPrefix`, and `labelSuffix` reflect their attributes and return
`null` when absent; assigning `null` or `undefined` removes the attribute.
Labels and `blur` update while unrevealed. The component reads `inline` when it
connects. There’s no public reset or conceal method.

## CSS Custom Properties

Customize the component's appearance with CSS variables:

| Property                        | Default        | Description                                       |
| ------------------------------- | -------------- | ------------------------------------------------- |
| `--content-warning-color`       | `currentColor` | Outline color for focus state                     |
| `--content-warning-blur-amount` | `10px`         | Amount of blur in blur mode (e.g., `5px`, `20px`) |

### Example

```css
content-warning {
  --content-warning-blur-amount: 15px;
}
```

## Shadow Parts

You can style internal elements using CSS Shadow Parts:

The warning button uses an opaque `Canvas` background with `CanvasText`, including
in blur mode. The surrounding blur overlay remains transparent, so the visual
effect still shows around the button. Focus uses the button’s foreground by
default and stays inside its backplate.

When updating an existing theme, set both foreground and an opaque background
on `::part(button)`. Styling only `::part(overlay)` no longer determines the
button’s surface. Check all label parts against that background, and keep a
visible focus outline. `--content-warning-color` still overrides the outline
when a theme needs a different focus color. Automatic forced-color adjustment
remains enabled.

| Part           | Description                                       |
| -------------- | ------------------------------------------------- |
| `overlay`      | The full-area overlay div that covers the content |
| `button`       | The warning button element inside the overlay     |
| `label-prefix` | The prefix text span (e.g., "Content Warning")    |
| `label-type`   | The warning type text span                        |
| `label-suffix` | The optional suffix text span                     |

### Example Styling

```css
/* Style the full-area overlay */
content-warning::part(overlay) {
  background: rgba(139, 0, 0, 0.95);
}

/* Style the button inside the overlay */
content-warning::part(button) {
  color: #fff;
  background: #260000;
  border: 3px solid #ff6b6b;
  padding: 2rem;
  font-size: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
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
}

/* Style inline warnings differently */
content-warning[inline]::part(overlay) {
  background: #333;
}

content-warning[inline]::part(button) {
  background: #333;
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
}
```

## Internationalization (i18n)

Use `label-prefix`, `type`, and `label-suffix` for your application’s vocabulary
or a translation. Set `lang` for translated content and provide image alternatives
in that language. The component doesn’t supply a shared localization object.

```html
<!-- Spanish -->
<content-warning
  type="violencia gore"
  label-prefix="Advertencia de Contenido"
  label-suffix="Haz clic para revelar"
  lang="es"
  hidden
>
  <img src="image.jpg" alt="Descripción de la imagen" />
</content-warning>

<!-- French -->
<content-warning
  type="contenu sensible"
  label-prefix="Avertissement"
  label-suffix="Cliquez pour révéler"
  lang="fr"
  hidden
>
  <p>Contenu en français...</p>
</content-warning>

<!-- No suffix -->
<content-warning type="graphic content" label-suffix="false" hidden>
  <p>Content without suffix text</p>
</content-warning>
```

Style each label part individually:

```css
content-warning::part(label-prefix) {
  font-weight: bold;
}

content-warning::part(label-type) {
  font-style: italic;
}

content-warning::part(label-suffix) {
  font-size: 0.875em;
}
```

### Customizing Punctuation

Punctuation and spacing between label parts are controlled via CSS pseudo-elements:

```css
/* Default punctuation (already applied) */
.label-prefix::after {
  content: ': '; /* Colon and space after prefix */
}

[part='label-type']::before {
  content: ' '; /* Space before type */
}

[part='label-suffix']::before {
  content: ' '; /* Space before suffix */
}

/* Customize punctuation */
content-warning::part(label-prefix)::after {
  content: ' — '; /* Em dash instead of colon */
}

/* Remove punctuation entirely */
content-warning::part(label-prefix)::after {
  content: ' '; /* Just a space */
}
```

## Accessibility

- A native `<button>` supports keyboard activation with Enter or Space. Its label
  combines the authored prefix, warning types, and optional suffix.
- Reveal removes the wrapper’s hiding attributes, the overlay, and the button.
  The component sets `revealed` and `role="alert"` on the host.
- It clones slotted **elements** into a persistent assertive alert region. Bare
  text nodes, such as the inline example’s text, aren’t cloned there.
- It calls `focus()` on the host but doesn’t add `tabindex`. Focus movement
  depends on whether the host is focusable; authors who need a focus target can
  set `tabindex="-1"` and test the resulting reading and keyboard order.
- Alert announcements and focus handling vary by browser and assistive
  technology. The alert mechanisms can produce repeated reading; they don’t
  guarantee that every screen reader announces the content once.

Keep warning labels clear, provide image alternatives, and test long content
and interactive descendants with the assistive technology your audience uses.
Keep the label’s background opaque, its text readable, and its focus indicator
visible when styling parts.

On disconnect, the component removes its overlay click listener. It doesn’t
restore authored `hidden`, cancel a pending render, or reset reveal state.
Reconnection renders another warning; don’t rely on moving an element to
restore its original state.

## Browser Support

This component uses modern web standards:

- Custom Elements v1
- Shadow DOM v1
- ES Modules

It also uses `requestAnimationFrame`, `inert`, and CSS Shadow Parts. The browser
suite exercises Chromium, Firefox, and WebKit; this isn’t an exhaustive
browser or assistive-technology support guarantee. If registration fails,
authored `hidden` remains in effect, and elements without it retain native content.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Install browser engines and check rendering and keyboard behavior
npx playwright install chromium firefox webkit
npm run test:browser

# Lint code
npm run lint

# Format code
npm run format

# Serve the repository and open /demo/ over HTTP
# ES module imports do not reliably load from file:// URLs.
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
