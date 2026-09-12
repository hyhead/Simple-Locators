const ICON_COPY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const ICON_CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

// Evaluated on $0 inside the inspected webpage
function inspectElement(el) {
  if (!el || el.nodeType !== 1) {
    return { css: 'No element selected', xpath: 'No element selected', cssMatches: 0, xpathMatches: 0, inIFrame: false, iframeInfo: '' };
  }

  // Detect if element is inside an iFrame
  let inIFrame = false;
  let iframeInfo = '';
  try {
    const ownerDoc = el.ownerDocument;
    if (ownerDoc !== document || (ownerDoc.defaultView && ownerDoc.defaultView !== window.top)) {
      inIFrame = true;
      const frameEl = ownerDoc.defaultView ? ownerDoc.defaultView.frameElement : null;
      if (frameEl) {
        iframeInfo = frameEl.id ? `#${frameEl.id}` : (frameEl.name ? `[name="${frameEl.name}"]` : frameEl.tagName.toLowerCase());
      } else {
        iframeInfo = 'Nested Frame Context';
      }
    }
  } catch (e) {
    inIFrame = true;
    iframeInfo = 'Cross-Origin Frame';
  }

  function countMatchingElements(selector, type) {
    try {
      if (type === 'css') {
        return document.querySelectorAll(selector).length;
      }
      const result = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      return result.snapshotLength;
    } catch (error) {
      return 0;
    }
  }

  function getCssSelector(element) {
    const path = [];
    let curr = element;
    while (curr && curr.nodeType === 1) {
      const tag = curr.nodeName.toLowerCase();
      
      if (curr.id) {
        path.unshift('#' + CSS.escape(curr.id));
        break;
      }
      
      const name = curr.getAttribute('name');
      if (name) {
        path.unshift(tag + '[name="' + CSS.escape(name) + '"]');
        break;
      }

      const testId = curr.getAttribute('data-testid');
      if (testId) {
        path.unshift(tag + '[data-testid="' + CSS.escape(testId) + '"]');
        break;
      }

      if (curr.className && typeof curr.className === 'string') {
        const classes = curr.className.trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          const classSelector = tag + '.' + classes.map(c => CSS.escape(c)).join('.');
          path.unshift(classSelector);
          break;
        }
      }

      let sibling = curr;
      let nth = 1;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.nodeName.toLowerCase() === tag) nth++;
      }
      path.unshift(nth !== 1 ? `${tag}:nth-of-type(${nth})` : tag);
      curr = curr.parentElement;
    }
    return path.join(' > ');
  }

  function getXPath(element) {
    const tag = element.tagName.toLowerCase();

    if (element.id) return '//*[@id="' + element.id + '"]';

    const name = element.getAttribute('name');
    if (name) return '//' + tag + '[@name="' + name + '"]';

    const testId = element.getAttribute('data-testid');
    if (testId) return '//' + tag + '[@data-testid="' + testId + '"]';

    if (element.className && typeof element.className === 'string') {
      const classVal = element.className.trim();
      if (classVal) return '//' + tag + '[@class="' + classVal + '"]';
    }

    const textContent = element.textContent ? element.textContent.trim().replace(/\s+/g, ' ') : '';
    if (textContent) {
      if (textContent.length <= 40) {
        return `//${tag}[text()="${textContent}"]`;
      } else {
        const partialText = textContent.substring(0, 20);
        return `//${tag}[contains(text(), "${partialText}")]`;
      }
    }

    if (element === document.body) return '/html/body';

    let ix = 0;
    const siblings = element.parentNode ? element.parentNode.childNodes : [];
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        return getXPath(element.parentNode) + '/' + tag + '[' + (ix + 1) + ']';
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }
    return '';
  }

  const css = getCssSelector(el);
  const xpath = getXPath(el);

  return {
    css: css,
    xpath: xpath,
    cssMatches: countMatchingElements(css, 'css'),
    xpathMatches: countMatchingElements(xpath, 'xpath'),
    inIFrame: inIFrame,
    iframeInfo: iframeInfo
  };
}

// Injected into the target page to highlight matching elements
function highlightOnPage(selector, type) {
  const existing = document.querySelectorAll('.__simple_locators_overlay__');
  existing.forEach(el => el.remove());

  if (!selector || selector === 'Select an element to inspect' || selector === 'No element selected') return 0;

  let els = [];
  try {
    if (type === 'css' || (!type && !selector.startsWith('//') && !selector.startsWith('('))) {
      els = Array.from(document.querySelectorAll(selector));
    } else {
      const res = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i = 0; i < res.snapshotLength; i++) {
        els.push(res.snapshotItem(i));
      }
    }
  } catch (e) {
    return 0;
  }

  els.forEach(el => {
    if (typeof el.getBoundingClientRect !== 'function') return;
    const rect = el.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = '__simple_locators_overlay__';
    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: rgba(138, 180, 248, 0.35);
      border: 2px solid #8ab4f8;
      border-radius: 2px;
      z-index: 99999999;
      pointer-events: none;
      box-sizing: border-box;
      box-shadow: 0 0 8px rgba(138, 180, 248, 0.6);
    `;
    document.body.appendChild(overlay);
  });

  if (els.length > 0 && typeof els[0].scrollIntoView === 'function') {
    els[0].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }

  return els.length;
}

function clearHighlightOnPage() {
  const existing = document.querySelectorAll('.__simple_locators_overlay__');
  existing.forEach(el => el.remove());
}

const cssVal = document.getElementById('css-val');
const xpathVal = document.getElementById('xpath-val');
const cssWarning = document.getElementById('css-warning');
const xpathWarning = document.getElementById('xpath-warning');
const copyCssBtn = document.getElementById('copy-css');
const copyXpathBtn = document.getElementById('copy-xpath');

const iframeBanner = document.getElementById('iframe-banner');
const iframeInfo = document.getElementById('iframe-info');

const testInput = document.getElementById('test-input');
const testBadge = document.getElementById('test-badge');

function setWarning(warningEl, locator, matchCount, locatorName, codeEl) {
  const isValid = locator && locator !== 'No element selected' && locator !== 'Select an element to inspect';

  if (!isValid || matchCount <= 1) {
    warningEl.hidden = true;
    warningEl.innerHTML = '';
    codeEl.classList.remove('error-highlight');
    return;
  }

  warningEl.hidden = false;
  codeEl.classList.add('error-highlight');
  warningEl.innerHTML = `
    <span class="warning-icon" aria-hidden="true">⚠</span>
    <span class="tooltip">Warning: This ${locatorName} matches ${matchCount} elements.</span>
  `;
}

function updateSelectors() {
  chrome.devtools.inspectedWindow.eval(
    `(${inspectElement.toString()})($0)`,
    (result, isException) => {
      if (!isException && result) {
        cssVal.textContent = result.css;
        xpathVal.textContent = result.xpath;

        setWarning(cssWarning, result.css, result.cssMatches, 'CSS', cssVal);
        setWarning(xpathWarning, result.xpath, result.xpathMatches, 'XPath', xpathVal);

        // Update iFrame Banner
        if (result.inIFrame) {
          iframeBanner.hidden = false;
          iframeInfo.textContent = result.iframeInfo;
        } else {
          iframeBanner.hidden = true;
        }
      } else {
        cssVal.textContent = 'Select an element to inspect';
        xpathVal.textContent = 'Select an element to inspect';
        cssVal.classList.remove('error-highlight');
        xpathVal.classList.remove('error-highlight');
        cssWarning.hidden = true;
        xpathWarning.hidden = true;
        iframeBanner.hidden = true;
      }
    }
  );
}

// --- Hover to Highlight ---
function triggerHighlight(locatorGetter, type) {
  const text = locatorGetter();
  if (!text || text === 'No element selected' || text === 'Select an element to inspect') return;
  chrome.devtools.inspectedWindow.eval(
    `(${highlightOnPage.toString()})(${JSON.stringify(text)}, "${type}")`
  );
}

function removeHighlight() {
  chrome.devtools.inspectedWindow.eval(`(${clearHighlightOnPage.toString()})()`);
}

cssVal.addEventListener('mouseenter', () => triggerHighlight(() => cssVal.textContent, 'css'));
cssVal.addEventListener('mouseleave', removeHighlight);

xpathVal.addEventListener('mouseenter', () => triggerHighlight(() => xpathVal.textContent, 'xpath'));
xpathVal.addEventListener('mouseleave', removeHighlight);

// --- Live Selector Tester ---
function runLiveTester() {
  const query = testInput.value.trim();
  if (!query) {
    testBadge.textContent = '0 matches';
    testBadge.className = 'badge default';
    removeHighlight();
    return;
  }

  const isXpath = query.startsWith('//') || query.startsWith('(') || query.startsWith('./');
  const type = isXpath ? 'xpath' : 'css';

  chrome.devtools.inspectedWindow.eval(
    `(${highlightOnPage.toString()})(${JSON.stringify(query)}, "${type}")`,
    (count, isException) => {
      if (isException || count === undefined || count === 0) {
        testBadge.textContent = '0 matches';
        testBadge.className = 'badge error';
      } else if (count === 1) {
        testBadge.textContent = '1 match';
        testBadge.className = 'badge success';
      } else {
        testBadge.textContent = `${count} matches`;
        testBadge.className = 'badge warning-badge';
      }
    }
  );
}

testInput.addEventListener('input', runLiveTester);

// Setup Copy Buttons
function setupCopy(triggerEl, textGetter, feedbackBtn) {
  triggerEl.addEventListener('click', () => {
    const text = textGetter();
    if (!text || text === 'No element selected' || text === 'Select an element to inspect') return;
    navigator.clipboard.writeText(text).then(() => {
      feedbackBtn.innerHTML = ICON_CHECK;
      setTimeout(() => {
        feedbackBtn.innerHTML = ICON_COPY;
      }, 1500);
    });
  });
}

setupCopy(copyCssBtn, () => cssVal.textContent, copyCssBtn);
setupCopy(cssVal, () => cssVal.textContent, copyCssBtn);
setupCopy(copyXpathBtn, () => xpathVal.textContent, copyXpathBtn);
setupCopy(xpathVal, () => xpathVal.textContent, copyXpathBtn);

chrome.devtools.panels.elements.onSelectionChanged.addListener(updateSelectors);
updateSelectors();