const ICON_COPY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const ICON_CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

// Function evaluated on $0 inside inspected page
function inspectElement(el) {
  if (!el || el.nodeType !== 1) return { css: 'No element selected', xpath: 'No element selected' };

  function getCssSelector(element) {
    const path = [];
    let curr = element;
    while (curr && curr.nodeType === 1) {
      const tag = curr.nodeName.toLowerCase();
      
      // 1. ID
      if (curr.id) {
        path.unshift('#' + CSS.escape(curr.id));
        break;
      }
      
      // 2. Name
      const name = curr.getAttribute('name');
      if (name) {
        path.unshift(tag + '[name="' + CSS.escape(name) + '"]');
        break;
      }

      // 3. data-testid
      const testId = curr.getAttribute('data-testid');
      if (testId) {
        path.unshift(tag + '[data-testid="' + CSS.escape(testId) + '"]');
        break;
      }

      // 4. Class Name
      if (curr.className && typeof curr.className === 'string') {
        const classes = curr.className.trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          const classSelector = tag + '.' + classes.map(c => CSS.escape(c)).join('.');
          path.unshift(classSelector);
          break;
        }
      }

      // Fallback: Structural nth-of-type traversal
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

    // 1. ID
    if (element.id) return '//*[@id="' + element.id + '"]';

    // 2. Name
    const name = element.getAttribute('name');
    if (name) return '//' + tag + '[@name="' + name + '"]';

    // 3. data-testid
    const testId = element.getAttribute('data-testid');
    if (testId) return '//' + tag + '[@data-testid="' + testId + '"]';

    // 4. Class Name
    if (element.className && typeof element.className === 'string') {
      const classVal = element.className.trim();
      if (classVal) return '//' + tag + '[@class="' + classVal + '"]';
    }

    // 5. Link Text & 6. Partial Link Text
    const textContent = element.textContent ? element.textContent.trim().replace(/\s+/g, ' ') : '';
    if (textContent) {
      if (textContent.length <= 40) {
        // Exact Link Text
        return `//${tag}[text()="${textContent}"]`;
      } else {
        // Partial Link Text
        const partialText = textContent.substring(0, 20);
        return `//${tag}[contains(text(), "${partialText}")]`;
      }
    }

    // Fallback: Structural XPath
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

  return { css: getCssSelector(el), xpath: getXPath(el) };
}

const cssVal = document.getElementById('css-val');
const xpathVal = document.getElementById('xpath-val');
const copyCssBtn = document.getElementById('copy-css');
const copyXpathBtn = document.getElementById('copy-xpath');

function updateSelectors() {
  chrome.devtools.inspectedWindow.eval(
    `(${inspectElement.toString()})($0)`,
    (result, isException) => {
      if (!isException && result) {
        cssVal.textContent = result.css;
        xpathVal.textContent = result.xpath;
      }
    }
  );
}

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

// Bind copy handlers to both buttons and code elements
setupCopy(copyCssBtn, () => cssVal.textContent, copyCssBtn);
setupCopy(cssVal, () => cssVal.textContent, copyCssBtn);

setupCopy(copyXpathBtn, () => xpathVal.textContent, copyXpathBtn);
setupCopy(xpathVal, () => xpathVal.textContent, copyXpathBtn);

// Update automatically whenever element selection changes in DevTools
chrome.devtools.panels.elements.onSelectionChanged.addListener(updateSelectors);
updateSelectors();