document.addEventListener("DOMContentLoaded", () => {
  const modalClose = document.getElementById("modal-close");
  const infoModal = document.getElementById("info-modal");
  modalClose.addEventListener("click", () => {
    infoModal.classList.add("hidden");
  });
});

const THEME_KEY = "theme";
const htmlEl = document.documentElement;
const toggleBtn = document.getElementById("theme-toggle");

chrome.storage.sync.get([THEME_KEY], ({ theme }) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (!theme && prefersDark);
  setTheme(isDark);
});

function setTheme(dark) {
  htmlEl.classList.toggle("dark", dark);
  htmlEl.classList.toggle("light", !dark);
  toggleBtn.textContent = dark ? "☀️" : "🌙";
}

toggleBtn.addEventListener("click", () => {
  const nowDark = !htmlEl.classList.contains("dark");
  setTheme(nowDark);
  chrome.storage.sync.set({ [THEME_KEY]: nowDark ? "dark" : "light" });
});

async function getSelectionOrArticle() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_SELECTION_TEXT" },
        (selResp) => {
          if (selResp?.text?.trim()) {
            return resolve(selResp.text);
          }

          chrome.tabs.sendMessage(
            tab.id,
            { type: "GET_ARTICLE_TEXT" },
            (artResp) => {
              resolve(artResp.text || "");
            }
          );
        }
      );
    });
  });
}

document.getElementById("summarize").addEventListener("click", async () => {
  const resultDiv = document.getElementById("result");
  const summaryType = document.getElementById("summary-type").value;
  const customPrompt = document.getElementById("custom-prompt").value.trim();

  resultDiv.textContent = "Extracting text…";

  chrome.storage.sync.get(["geminiApiKey"], async ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultDiv.textContent = "No API Key set. Click the gear icon to add one.";
      return;
    }

    const rawText = await getSelectionOrArticle();
    if (!rawText) {
      resultDiv.textContent = "Couldn't extract any text from this page.";
      return;
    }

    const defaultPrompts = {
      brief: `Summarize the following text in 2–3 sentences:

${rawText}`,

      detailed: `Provide a detailed summary of the following text:

${rawText}`,

      bullets: `Summarize the following text in 5–7 bullet points (start each line with "-"):

${rawText}`,

      email: `Draft a clear, professional email based on the following content. Include:
- A suitable greeting
- A concise description of purpose
- The key details
- A polite closing and signature

Content:
${rawText}`,

      grammar: `Proofread and correct the grammar, spelling, punctuation, and style of the following text. Preserve the original meaning:

${rawText}`,
    };

    let prompt;
    if (customPrompt) {
      prompt = `${customPrompt}

Context:
${rawText}`;
    } else {
      prompt = defaultPrompts[summaryType] || defaultPrompts.brief;
    }

    try {
      const summary = await getGeminiSummary(prompt, geminiApiKey);
      resultDiv.textContent = summary;
    } catch (err) {
      resultDiv.textContent = "Gemini error: " + err.message;
    }
  });
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const text = document.getElementById("result").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copy-btn");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });
});

async function getGeminiSummary(prompt, apiKey) {
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error?.message || "Request failed");
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No summary.";
}
