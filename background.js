chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    if (!result.geminiApiKey) {
      chrome.tabs.create({ url: "options.html" });
    }
  });
});

// When the extension is installed or updated, open the Options page
// if the user hasn't set a Gemini API key yet.
// Storage notes:
// - chrome.storage.local: stores data locally on the current device.
// - chrome.storage.sync: syncs data across devices under the same Chrome profile.
// We choose 'sync' so the API key persists across the user’s signed-in instances of Chrome.
