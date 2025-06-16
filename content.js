// content.js

// Extract full-article text (all <article> or <p> contents)
function getArticleText() {
  const articleEl = document.querySelector("article");
  if (articleEl) return articleEl.innerText;

  const paragraphs = Array.from(document.querySelectorAll("p"));
  return paragraphs.map((p) => p.innerText).join("\n");
}

// Extract only the user’s current selection
function getSelectionText() {
  return window.getSelection().toString();
}

// Listen for popup messages
chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_SELECTION_TEXT") {
    sendResponse({ text: getSelectionText() });
  } else if (req.type === "GET_ARTICLE_TEXT") {
    sendResponse({ text: getArticleText() });
  }
  // No return true needed since sendResponse is called synchronously
});
