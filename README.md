# Simple Locators

A small Chrome DevTools extension that shows CSS and XPath selectors for the element currently selected in the Elements panel.

## Install

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked** and choose this repository folder.

## Use

1. Open DevTools and select the **Elements** panel.
2. Select an element in the page or the DOM tree.
3. Open the **Selectors** sidebar to view its CSS selector and XPath.

Use the copy buttons beside either selector to copy it to the clipboard.

## Selector preference

Selectors use the first available stable attribute in this order:

- `id`
- `name`
- `data-testid`

If none is present, the extension builds a selector from the element hierarchy and sibling position.