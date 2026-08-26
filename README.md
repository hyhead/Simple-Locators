# Simple Locators

Simple Locators is a Chrome DevTools extension that generates CSS selectors and XPath expressions for the element selected in the **Elements** panel.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder.

## Use

Open DevTools, select an element, and open the **Selectors** sidebar. The extension updates the CSS selector and XPath whenever the DevTools selection changes. Click either selector or its copy button to copy it.

## How selectors are generated

The extension prefers `id`, `name`, `data-testid`, and class attributes. When those are unavailable, it uses the element hierarchy and sibling position. XPath can also use exact or partial text for elements with text content.

## Development

This is an unpacked Manifest V3 extension. The main files are:

- `devtools.js`: registers the Elements sidebar.
- `panel.html`, `panel.css`, and `panel.js`: render the sidebar and generate selectors.