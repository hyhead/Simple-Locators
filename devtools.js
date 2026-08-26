// Creates a static sidebar pane next to Styles/Computed in the Elements panel
chrome.devtools.panels.elements.createSidebarPane("Selectors", function(sidebar) {
  sidebar.setPage("panel.html");
});