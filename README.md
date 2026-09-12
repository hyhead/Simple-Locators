# Simple Locators

Simple Locators is a Chrome DevTools extension that generates, tests, and evaluates robust CSS selectors and XPath expressions for any element selected in the **Elements** panel[cite: 7].

## Features

* **Instant Selector Generation**: Automatically generates optimized CSS Selectors and XPath expressions whenever an element is inspected[cite: 7].
* **Live Selector Tester**: Test any custom CSS or XPath query in real time at the top of the panel with live match count badges.
* **Duplicate Match Warnings**: Highlights locators in red with a warning icon (`⚠`) and hover tooltip whenever a selector matches multiple elements on the page.
* **Hover to Highlight**: Hover over any locator box or live search result to highlight and scroll to matching elements directly on the active webpage.
* **iFrame Detection**: Automatically detects if an inspected element resides inside an `<iframe>` and displays its frame context.
* **One-Click Copy**: Click any locator code block or copy icon to copy the selector directly to your clipboard[cite: 7].

## Install

1. Clone or download this repository folder.
2. Open `chrome://extensions` in Chrome[cite: 7].
3. Enable **Developer mode** in the top-right corner[cite: 7].
4. Click **Load unpacked** and select this repository folder[cite: 7].

## Use

1. Open Chrome DevTools (`F12` or `Right-Click -> Inspect`)[cite: 7].
2. Select an element in the **Elements** panel[cite: 7].
3. Open the **Selectors** sidebar tab next to *Styles* / *Computed*[cite: 2, 7].
4. View the generated **CSS Selector** and **XPath**[cite: 7].
5. Hover over a locator box to visually highlight matching elements on the live webpage, or click it to copy[cite: 7].
6. Use the **Live Selector Tester** at the top to type and test custom CSS selectors or XPath queries against the active DOM.

## How Selectors are Generated

The locator generation algorithm prioritizes stable attributes[cite: 7]:
1. Unique `id`[cite: 6, 7]
2. `name` attribute[cite: 6, 7]
3. `data-testid` attribute[cite: 6, 7]
4. Class names[cite: 6, 7]
5. Structural hierarchy and sibling position (`:nth-of-type` fallback)[cite: 6, 7]

XPath expressions also leverage exact or partial text content for elements containing text[cite: 6, 7].

## Project Structure

This is an unpacked Manifest V3 Chrome DevTools extension[cite: 3, 7]:

- `manifest.json`: Manifest V3 configuration and extension settings[cite: 3, 7].
- `devtools.html` & `devtools.js`: Registers the custom sidebar pane inside DevTools[cite: 1, 2, 7].
- `panel.html`: UI structure for the sidebar, including the Live Tester, locator boxes, and footer hints[cite: 5, 7].
- `panel.css`: Dark-theme styling, error highlights, tooltips, and match badges[cite: 4, 7].
- `panel.js`: Core logic for element inspection, match evaluation, DOM highlighting, and iframe detection[cite: 6, 7].