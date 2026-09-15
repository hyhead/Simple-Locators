# Simple Locators

Simple Locators is a Chrome DevTools extension that generates, tests, scans, and evaluates robust CSS selectors and XPath expressions for any element on the active web page.

## Features

* **Instant Selector Generation**: Automatically generates optimized CSS Selectors and XPath expressions whenever an element is inspected.
* **Live Selector Tester**: Test any custom CSS or XPath query in real time with live match count badges and on-page overlays.
* **⚡ Page Scanner**: Instantly scans and lists up to 50 interactable elements (inputs, buttons, links, `data-testid`). Includes a draggable handle to resize the results pane.
* **Hover & Select**: Hover over any locator box to highlight matching elements on the webpage, or click to copy the locator and jump directly to the element in the DOM tree.
* **Duplicate Match Warnings**: Highlights locators in red with a warning icon (`⚠`) whenever a selector matches multiple elements.
* **iFrame & SPA Support**: Detects `<iframe>` contexts, safely handles restricted browser pages, and auto-resets when navigating across SPA routes.

## Install

1. Clone or download this repository folder.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select this repository folder.

## Use

1. Open Chrome DevTools (`F12` or `Right-Click -> Inspect`).
2. Open the **Simple Locators** panel tab.
3. Select an element in the **Elements** panel or click **⚡ Scan Page** to detect interactive elements automatically.
4. View generated **CSS Selector** and **XPath** values, hover to highlight, or click to copy and focus in the DOM tree.
5. Use the **Live Selector Tester** at the top to type and test custom CSS selectors or XPath queries against the active page.
6. Drag the resize handle below the scanner section to expand or collapse the scanned element list.

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
* **Virtual Scrolling & Unrendered Elements**: Match counts only evaluate elements currently rendered in the active DOM tree. Unrendered elements will not be counted until mounted.
* **Canvas & SVG Inner Elements**: Sub-elements inside `<canvas>` grids or complex inline `<svg>` shapes cannot be targeted beyond their top-level element wrapper.

## Project Structure

This is an unpacked Manifest V3 Chrome DevTools extension:

- `manifest.json`: Manifest V3 configuration and extension settings.
- `devtools.html` & `devtools.js`: Registers the custom panel tab inside DevTools.
- `panel.html`: UI structure including Live Tester, locator boxes, scanner list, and resize handle.
- `panel.css`: Dark-theme styling, error highlights, tooltips, and resizer handle layout.
- `panel.js`: Core logic for element inspection, live scanner, safe page evaluation, and navigation listeners.