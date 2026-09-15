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
      background: rgba(102, 237, 174, 0.35);
      border: 2px solid rgb(102, 237, 174);
      border-radius: 2px;
      z-index: 99999999;
      pointer-events: none;
      box-sizing: border-box;
      box-shadow: 0 0 8px rgba(102, 237, 174, 0.6);
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

// Safe evaluation wrapper to prevent uncaught runtime DevTools exceptions
function safeEval(script, callback) {
  try {
    chrome.devtools.inspectedWindow.eval(script, (result, isException) => {
      if (chrome.runtime.lastError) {
        if (callback) callback(null, true);
        return;
      }
      if (callback) callback(result, isException);
    });
  } catch (err) {
    if (callback) callback(null, true);
  }
}

// Selects and focuses element inside DevTools Elements panel DOM
function selectInDevToolsElements(locator, type) {
  if (!locator) return;
  let evalCode = '';
  if (type === 'css') {
    evalCode = `inspect(document.querySelector(${JSON.stringify(locator)}))`;
  } else {
    evalCode = `inspect(document.evaluate(${JSON.stringify(locator)}, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)`;
  }
  safeEval(evalCode);
}

// --- Page Scanner Logic (Evaluated on Inspected Page) ---
function scanPageElements() {
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
          path.unshift(tag + '.' + classes.map(c => CSS.escape(c)).join('.'));
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
      if (textContent.length <= 40) return `//${tag}[text()="${textContent}"]`;
      else return `//${tag}[contains(text(), "${textContent.substring(0, 20)}")]`;
    }
    if (element === document.body) return '/html/body';
    
    let ix = 0;
    const siblings = element.parentNode ? element.parentNode.childNodes : [];
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) return getXPath(element.parentNode) + '/' + tag + '[' + (ix + 1) + ']';
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
    return '';
  }

  const results = [];
  const patterns = [
    { label: 'data-testid Element', selector: '[data-testid]' },
    { label: 'Username / Email', selector: 'input[type="email"], input[name*="user" i], input[id*="user" i], input[name*="login" i]' },
    { label: 'Password Input', selector: 'input[type="password"]' },
    { label: 'Search Input', selector: 'input[type="search"], input[name*="search" i]' },
    { label: 'Submit Button', selector: 'button[type="submit"], input[type="submit"]' },
    { label: 'Generic Button', selector: 'button:not([type="submit"])' },
    { label: 'Text Input', selector: 'input[type="text"]' },
    { label: 'Link (href)', selector: '[href]' }
  ];

  const seen = new Set();
  patterns.forEach(p => {
    const elements = document.querySelectorAll(p.selector);
    elements.forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      let displayLabel = p.label;
      const testId = el.getAttribute('data-testid');
      const href = el.getAttribute('href');
      const name = el.getAttribute('name');
      const id = el.id;

      if (testId) {
        displayLabel = `data-testid="${testId}" (${el.tagName.toLowerCase()})`;
      } else if (href) {
        const displayHref = href.length > 30 ? href.substring(0, 27) + '...' : href;
        displayLabel = `Link [href="${displayHref}"]`;
      } else if (name) {
        displayLabel += ` (${name})`;
      } else if (id) {
        displayLabel += ` (#${id})`;
      }
      
      results.push({
        label: displayLabel,
        css: getCssSelector(el),
        xpath: getXPath(el)
      });
    });
  });

  return results.slice(0, 50);
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

const scanBtn = document.getElementById('scan-page-btn');
const formatSelect = document.getElementById('locator-format');
const scanResultsWrap = document.getElementById('scanner-results');
const scannerSection = document.querySelector('.scanner-section');

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
  safeEval(
    `(${inspectElement.toString()})($0)`,
    (result, isException) => {
      if (!isException && result) {
        cssVal.textContent = result.css;
        xpathVal.textContent = result.xpath;

        setWarning(cssWarning, result.css, result.cssMatches, 'CSS', cssVal);
        setWarning(xpathWarning, result.xpath, result.xpathMatches, 'XPath', xpathVal);

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
  safeEval(`(${highlightOnPage.toString()})(${JSON.stringify(text)}, "${type}")`);
}

function removeHighlight() {
  safeEval(`(${clearHighlightOnPage.toString()})()`);
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

  safeEval(
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

// --- Setup Copy Buttons ---
function setupCopy(triggerEl, textGetter, feedbackBtn, typeGetter) {
  triggerEl.addEventListener('click', () => {
    const text = textGetter();
    if (!text || text === 'No element selected' || text === 'Select an element to inspect') return;
    
    if (typeGetter) {
      selectInDevToolsElements(text, typeGetter());
    }

    navigator.clipboard.writeText(text).then(() => {
      feedbackBtn.innerHTML = ICON_CHECK;
      setTimeout(() => {
        feedbackBtn.innerHTML = ICON_COPY;
      }, 1500);
    });
  });
}

setupCopy(copyCssBtn, () => cssVal.textContent, copyCssBtn, () => 'css');
setupCopy(cssVal, () => cssVal.textContent, copyCssBtn, () => 'css');
setupCopy(copyXpathBtn, () => xpathVal.textContent, copyXpathBtn, () => 'xpath');
setupCopy(xpathVal, () => xpathVal.textContent, copyXpathBtn, () => 'xpath');

chrome.devtools.panels.elements.onSelectionChanged.addListener(updateSelectors);
updateSelectors();

// --- Page Ready State Polling & Navigation Observer ---
let pollReadyInterval = null;
let currentInspectedUrl = '';

// Checks for website link/URL changes (supports both standard and SPA routing)
function checkUrlChange() {
  safeEval(
    `window.location.href`,
    (url, isException) => {
      if (!isException && url) {
        if (currentInspectedUrl && currentInspectedUrl !== url) {
          currentInspectedUrl = url;
          resetScannerState();
        } else if (!currentInspectedUrl) {
          currentInspectedUrl = url;
        }
      }
    }
  );
}

function checkPageReadyState() {
  safeEval(
    `document.readyState === 'complete'`,
    (isComplete, isException) => {
      if (!isException && isComplete) {
        scanBtn.disabled = false;
        if (pollReadyInterval) {
          clearInterval(pollReadyInterval);
          pollReadyInterval = null;
        }
        if (scannedLocatorsData.length === 0 && !scanBtn.classList.contains('scanned')) {
          scanResultsWrap.innerHTML = '<div class="empty-msg">Click scan to find inputs, buttons, links, and data-testid elements.</div>';
        }
      } else {
        scanBtn.disabled = true;
        if (scannedLocatorsData.length === 0 && !scanBtn.classList.contains('scanned')) {
          scanResultsWrap.innerHTML = '<div class="empty-msg">Waiting for page to load completely...</div>';
        }
        if (!pollReadyInterval) {
          pollReadyInterval = setInterval(checkPageReadyState, 500);
        }
      }
    }
  );
}

function resetScannerState() {
  scanBtn.disabled = true;
  scanBtn.classList.remove('scanned');
  scannerSection.classList.remove('scanned-active');
  scannedLocatorsData = [];
  scanResultsWrap.innerHTML = '<div class="empty-msg">Waiting for page to load completely...</div>';

  safeEval(`window.location.href`, (url) => {
    if (url) currentInspectedUrl = url;
  });

  checkPageReadyState();
}

// Reset on full page refresh / top-level navigation
chrome.devtools.network.onNavigated.addListener(() => {
  resetScannerState();
});

// Initial load check
checkPageReadyState();
checkUrlChange();

// Periodically check for client-side link and URL changes safely
setInterval(checkUrlChange, 1000);

// --- Page Scanner UI Event Handlers ---
let scannedLocatorsData = [];

function renderScannedLocators() {
  if (!scannedLocatorsData || scannedLocatorsData.length === 0) {
    scanResultsWrap.innerHTML = '<div class="empty-msg">No matching elements detected.</div>';
    return;
  }

  scanResultsWrap.innerHTML = '';
  const selectedFormat = formatSelect.value;

  scannedLocatorsData.forEach(item => {
    const locatorString = selectedFormat === 'xpath' ? item.xpath : item.css;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'scan-item';

    const header = document.createElement('div');
    header.className = 'scan-item-header';
    header.textContent = item.label;

    const bodyWrap = document.createElement('div');
    bodyWrap.className = 'scan-item-body';

    const codeEl = document.createElement('code');
    codeEl.className = 'scan-item-code';
    codeEl.textContent = locatorString;
    codeEl.title = 'Hover to highlight, click to copy & select in DOM';

    const itemCopyBtn = document.createElement('button');
    itemCopyBtn.className = 'scan-copy-btn';
    itemCopyBtn.title = 'Copy Locator and Select in Elements Panel';
    itemCopyBtn.innerHTML = ICON_COPY;

    codeEl.addEventListener('mouseenter', () => triggerHighlight(() => locatorString, selectedFormat));
    codeEl.addEventListener('mouseleave', removeHighlight);

    const performCopyAndSelect = () => {
      selectInDevToolsElements(locatorString, selectedFormat);

      navigator.clipboard.writeText(locatorString).then(() => {
        itemCopyBtn.innerHTML = ICON_CHECK;
        const originalText = codeEl.textContent;
        codeEl.textContent = 'Copied & Selected!';
        setTimeout(() => {
          itemCopyBtn.innerHTML = ICON_COPY;
          codeEl.textContent = originalText;
        }, 1200);
      });
    };

    codeEl.addEventListener('click', performCopyAndSelect);
    itemCopyBtn.addEventListener('click', performCopyAndSelect);

    bodyWrap.appendChild(codeEl);
    bodyWrap.appendChild(itemCopyBtn);
    itemDiv.appendChild(header);
    itemDiv.appendChild(bodyWrap);

    scanResultsWrap.appendChild(itemDiv);
  });
}

formatSelect.addEventListener('change', renderScannedLocators);

scanBtn.addEventListener('click', () => {
  if (scanBtn.disabled) return;

  scanBtn.textContent = 'Scanning...';
  safeEval(
    `(${scanPageElements.toString()})()`,
    (results, isException) => {
      scanBtn.textContent = '⚡ Scan Page';
      if (isException) {
        scanResultsWrap.innerHTML = '<div class="empty-msg">Error scanning the page.</div>';
        return;
      }

      scanBtn.classList.add('scanned');
      scannerSection.classList.add('scanned-active');

      scannedLocatorsData = results || [];
      renderScannedLocators();
    }
  );
});

// --- Page Scanner Resizer Handle Event Handler ---
function initScannerResizer() {
  const resizeHandle = document.getElementById('scanner-resize-handle');
  const targetContainer = document.getElementById('scanner-results');

  if (!resizeHandle || !targetContainer) return;

  let startY = 0;
  let startHeight = 0;

  const doDrag = (e) => {
    const newHeight = startHeight + (e.clientY - startY);
    if (newHeight >= 60 && newHeight <= 800) {
      targetContainer.style.height = `${newHeight}px`;
    }
  };

  const stopDrag = () => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startY = e.clientY;
    startHeight = parseInt(document.defaultView.getComputedStyle(targetContainer).height, 10) || targetContainer.clientHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  });
}

initScannerResizer();