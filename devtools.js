// Creates a static sidebar pane next to Styles/Computed in the Elements panel
chrome.devtools.panels.elements.createSidebarPane("Selectors Made Eazy", function(sidebar) {
  sidebar.setPage("panel.html");
});