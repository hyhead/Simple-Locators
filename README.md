# Simple Locators

Simple Locators is a Chrome DevTools extension that generates, tests, and evaluates robust CSS selectors and XPath expressions for any element selected in the **Elements** panel.

## Features

* **Instant Selector Generation**: Automatically generates optimized CSS Selectors and XPath expressions whenever an element is inspected.
* **Live Selector Tester**: Test any custom CSS or XPath query in real time at the top of the panel with live match count badges.
* **Duplicate Match Warnings**: Highlights locators in red with a warning icon (`⚠`) and hover tooltip whenever a selector matches multiple elements on the page.
* **Hover to Highlight**: Hover over any locator box or live search result to highlight and scroll to matching elements directly on the active webpage.
* **iFrame Detection**: Automatically detects if an inspected element resides inside an `<iframe>` and displays its frame context.
* **One-Click Copy**: Click any locator code block or copy icon to copy the selector directly to your clipboard.

## Install

1. Clone or download this repository folder.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select this repository folder.

## Use

1. Open Chrome DevTools (`F12` or `Right-Click -> Inspect`).
2. Select an element in the **Elements** panel.
3. Open the **Selectors** sidebar tab next to *Styles* / *Computed*.
4. View the generated **CSS Selector** and **XPath**.
5. Hover over a locator box to visually highlight matching elements on the live webpage, or click it to copy.
6. Use the **Live Selector Tester** at the top to type and test custom CSS selectors or XPath queries against the active DOM.

## How Selectors are Generated

The locator generation algorithm prioritizes stable attributes:
1. Unique `id`
2. `name` attribute
3. `data-testid` attribute
4. Class names
5. Structural hierarchy and sibling position (`:nth-of-type` fallback)

XPath expressions also leverage exact or partial text content for elements containing text.

## Limitations

* **Shadow DOM**: Elements residing inside closed Shadow DOM roots cannot be accessed or highlighted across shadow boundaries.
* **Cross-Origin iFrames**: While iFrame presence is detected, element matching and DOM traversal inside cross-origin `<iframe>` contexts are restricted by browser security policies.
* **Dynamic Classes & IDs**: Framework-generated hashes (e.g., CSS-in-JS or build-generated dynamic class names like `.style__3a9b`) may produce fragile locators if static attributes (`data-testid`, `id`) are missing.
* **Virtual Scrolling & Unrendered Elements**: Match counts only evaluate elements currently rendered in the active DOM tree. Elements unmounted due to virtual scrolling or lazy loading will not be counted until rendered.
* **Canvas & SVG Inner Elements**: Sub-elements inside `<canvas>` grids or complex inline `<svg>` shapes cannot be targeted beyond their top-level element wrapper.

## Project Structure

This is an unpacked Manifest V3 Chrome DevTools extension:

- `manifest.json`: Manifest V3 configuration and extension settings.
- `devtools.html` & `devtools.js`: Registers the custom sidebar pane inside DevTools.
- `panel.html`: UI structure for the sidebar, including the Live Tester, locator boxes, and footer hints.
- `panel.css`: Dark-theme styling, error highlights, tooltips, and match badges.
- `panel.js`: Core logic for element inspection, match evaluation, DOM highlighting, and iframe detection.