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

| Attribute      | Type      | Default              | Description                                                                |
| -------------- | --------- | -------------------- | -------------------------------------------------------------------------- |
| `type`         | `string`  | `"content"`          | Space-separated list of warning types (e.g., "violence spoilers nsfw")     |
| `reveal-label` | `string`  | absent               | Complete visible button label, also its accessible name; supports `{type}` |
| `type-label`   | `string`  | `"content"` fallback | Text to use when `type` is missing or empty                                |
| `inline`       | `boolean` | `false`              | Display the warning inline instead of as a block overlay                   |
| `blur`         | `boolean` | `false`              | Blur slotted elements instead of using native hiding after render          |
| `hidden`       | `boolean` | `false`              | Native pre-upgrade hiding; removed when the component connects             |

Without a template, the existing “Content Warning: {type} Click to reveal”
presentation remains unchanged. See [deprecated label fragments](#deprecated-label-fragments)
for compatibility behavior.

Template values must be nonempty plain text. `{type}` is the only supported
token and may appear more than once or be omitted for a fixed label. Other
tokens and unmatched braces are invalid. Values substituted into `{type}` are
literal text: markup, dollar signs, and braces in a warning type aren’t evaluated.
The resolved label must also contain nonwhitespace text.
`type-label` is plain text, not another template. Each new attribute has a
matching camelCase property; see [localization](#internationalization-i18n).

## Events

The component fires custom events that you can listen to:

| Event                      | Description                                    | Detail                                                 |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `content-warning:revealed` | Fired once when the user activates the warning | `{ type: string \| null }` - The authored warning type |

The event bubbles and crosses shadow boundaries. It isn’t cancelable and fires
after the reveal state and DOM update, before the focus attempt. A missing `type`
attribute produces `null` in the event detail even though the button uses the
configured fallback wording (English “content” by default).

### Example Event Handling

```javascript
const element = document.querySelector('content-warning');

element.addEventListener('content-warning:revealed', (event) => {
  console.log('Content revealed:', event.detail.type);
  // Track analytics, log user action, etc.
});
```

## Properties

| Property      | Type                  | Description                             |
| ------------- | --------------------- | --------------------------------------- |
| `type`        | `string \| null`      | Get/set the warning type(s)             |
| `revealLabel` | `string \| null`      | Authored complete-label override        |
| `typeLabel`   | `string \| null`      | Authored missing-type fallback override |
| `revealed`    | `boolean` (read-only) | Whether the content has been revealed   |

`type`, `revealLabel`, and `typeLabel` reflect their attributes and return
`null` when absent; assigning `null` or `undefined` removes the attribute.
They return authored values, not resolved page defaults. Pre-definition property
assignments are replayed on connection. Labels and `blur` update while
unrevealed; updating label text keeps the button, focus, and content intact and
doesn’t emit `content-warning:revealed`. The component reads `inline` when it
connects. There’s no public reset or conceal method.

## Methods

| Method      | Result    | Behavior                                                                                             |
| ----------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `refresh()` | `boolean` | Reread shared and instance labels in place; call on each affected instance after editing shared JSON |
| `render()`  | `void`    | Initialize shadow content once; later calls refresh labels rather than rebuild content               |

Wait for initial rendering before calling `refresh()`; connection schedules it
on the next animation frame. A disconnected/uninitialized call returns `false`
and logs an `InvalidStateError`. Invalid configuration also returns `false`,
logs the error, and preserves the previous button text. Invalid initial
configuration logs an error and uses the existing legacy label presentation so
the reveal control remains usable. Correct the configuration and call
`refresh()` to recover.

After reveal, `refresh()` returns `true` without reading configuration or changing
content; `render()` is also a no-op. Neither method conceals content again.

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

| Part           | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `overlay`      | The full-area overlay div that covers the content                  |
| `button`       | The warning button element inside the overlay                      |
| `label`        | Complete template label, with punctuation supplied by the template |
| `label-prefix` | Deprecated legacy prefix span                                      |
| `label-type`   | Deprecated legacy type span                                        |
| `label-suffix` | Deprecated legacy suffix span                                      |

The three legacy label parts remain available when no template is selected.
Template labels use a single `label` span instead; moving to a template also
means moving any fragment-specific styling to `::part(label)` or `::part(button)`.

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

/* Style the complete template label */
content-warning::part(label) {
  font-weight: bold;
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

Use a complete `reveal-label` template for your application’s vocabulary or a
translation. Authors control word order, punctuation, and the warning type.
The visible button text also supplies its accessible name; there isn’t a
separate hidden translation to maintain.

```html
<content-warning
  type="violencia gore"
  reveal-label="Advertencia: {type}. Mostrar contenido"
  lang="es"
  hidden
>
  <img src="image.jpg" alt="Descripción de la imagen" />
</content-warning>
```

Set `lang` for translated content and provide image alternatives in that
language. `lang` doesn’t select translations: this component ships no
multilingual catalog. When `type` is missing or empty, `type-label` supplies the
context, falling back to `"content"`. Translate that fallback too, supply an
explicit localized `type`, or use a template without `{type}`.

### Shared labels

Place one inline JSON script in the document to share defaults across instances:

```html
<script type="application/json" data-content-warning-config>
  {
    "reveal-label": "Aviso: {type}. Mostrar contenido",
    "type-label": "contenido"
  }
</script>

<content-warning type="spoilers" lang="es" hidden>
  <p>El personaje regresa al final.</p>
</content-warning>

<content-warning reveal-label="Mostrar detalles" lang="es" hidden>
  <p>Más detalles sobre la historia.</p>
</content-warning>
```

The first warning uses the shared template; the second supplies an instance
override. The script accepts a flat, partial object with `reveal-label` and/or
`type-label` string keys. Missing keys retain their defaults. There are no
language dictionaries or named scopes: translate the values yourself, and
leave the marker empty. The marker is always `data-content-warning-config`,
even when registering a different tag name.

Label precedence is:

1. Instance `reveal-label`.
2. Explicit legacy prefix/suffix attributes, if either is present.
3. Shared `reveal-label`.
4. Existing legacy default presentation.

For missing-type context, instance `type-label` overrides shared `type-label`,
then `"content"`; a nonempty `type` always wins. Removing an override exposes
the next layer. An empty new label is invalid, not a way to remove an override.

Malformed JSON, unknown keys, nonstring/empty values, duplicate scripts,
external scripts, non-JSON script types, and nonempty scope markers are reported
as configuration errors, even if an instance overrides the affected value.
Read the [method recovery contract](#methods).

Place the script before the warnings when possible. Shared script edits or
replacement aren’t observed automatically; call `refresh()` on each affected,
initialized instance. Parsed JSON is cached until its text changes. A page
language change alone doesn’t alter the supplied strings.

### Deprecated label fragments

The fragment attributes, properties, and three label-fragment parts are
deprecated and planned for removal in the next major release. They still work
in this additive update; no runtime deprecation warnings are emitted.

| Attribute / property           | Legacy behavior                                              |
| ------------------------------ | ------------------------------------------------------------ |
| `label-prefix` / `labelPrefix` | Prefix text, default `"Content Warning"`                     |
| `label-suffix` / `labelSuffix` | Suffix text, default `"Click to reveal"`; `"false"` omits it |

These properties return raw `string | null` values and remove attributes when
assigned `null` or `undefined`. Existing CSS punctuation on `label-prefix`,
`label-type`, and `label-suffix` is preserved on the legacy path. Initial
rendering includes the default suffix; later legacy updates omit an absent
suffix but use the default for an empty suffix, as before. Use `"false"` for
consistent legacy suppression.

Migrate the whole phrase, including punctuation, and remove fragment attributes
and fragment-specific styles:

```html
<!-- Before -->
<content-warning
  type="spoilers"
  label-prefix="Warning"
  label-suffix="Show details"
  hidden
>
  <p>The character returns.</p>
</content-warning>

<!-- After -->
<content-warning
  type="spoilers"
  reveal-label="Warning: {type}. Show details"
  hidden
>
  <p>The character returns.</p>
</content-warning>
```

## Accessibility

- A native `<button>` supports keyboard activation with Enter or Space. Its label
  uses the selected whole-phrase template or the legacy fragment presentation.
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

On disconnect, the component removes its overlay click listener and cancels a
pending initialization frame. It doesn’t restore authored `hidden` or reset
reveal state. Reconnection reuses the existing UI and listener without concealing
revealed content or repeating the reveal event.

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
