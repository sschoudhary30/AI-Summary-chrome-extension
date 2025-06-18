function getArticleText() {
  const articleEl = document.querySelector("article");
  if (articleEl) return articleEl.innerText;

  const paragraphs = Array.from(document.querySelectorAll("p"));
  return paragraphs.map((p) => p.innerText).join("\n");
}

function getSelectionText() {
  return window.getSelection().toString();
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_SELECTION_TEXT") {
    sendResponse({ text: getSelectionText() });
  } else if (req.type === "GET_ARTICLE_TEXT") {
    sendResponse({ text: getArticleText() });
  }
});
