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

document.getElementById("summarize").addEventListener("click", () => {
  const resultDiv = document.getElementById("result");

  const summaryType = document.getElementById("summary-type").value;

  resultDiv.textContent = "Extracting text...";

  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultDiv.textContent = "No API Key set. Click the gear icon to add one.";
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_TEXT" },
        async ({ text }) => {
          if (!text) {
            resultDiv.textContent = "Couldn't extract text from this page.";
            return;
          }

          try {
            const summary = await getGeminiSummary(
              text,
              summaryType,
              geminiApiKey
            );

            resultDiv.textContent = summary;
          } catch (error) {
            resultDiv.textContent = "Gemini error: " + error.message;
          }
        }
      );
    });
  });
});

async function getGeminiSummary(rawText, type, apiKey) {
  const max = 20000;

  const text = rawText.length > max ? rawText.slice(0, max) + "..." : rawText;

  const promptMap = {
    brief: `Summarize in 2-3 sentences:\n\n${text}`,
    detailed: `Give a detailed summary:\n\n${text}`,
    bullets: `Summarize in 5-7 bullet point (start each line with "-"):\n\n${text}`,
  };

  const prompt = promptMap[type] || promptMap.brief;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    }
  );

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error?.message || "Request failed");
  }

  const data = await res.json();

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No summary.";
}
