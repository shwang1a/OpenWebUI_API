mermaid.initialize({ startOnLoad: false, theme: "default" });

const CONFIG = {
  API_KEY: "sk-0272fcf92eb543d7bf1ae39f29f2d2d5",
  BASE_URL: "https://webui.igis.com.tw/api",
};

let MODEL_ID = "pops_\u5fc3\u88fd\u5716";

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const modelSelect = document.getElementById("modelSelect");

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  if (modelSelect) {
    MODEL_ID = modelSelect.value;
  }

  appendMessage("user", text);
  userInput.value = "";

  try {
    const response = await fetch(`${CONFIG.BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: "user", content: text }],
        stream: false,
      }),
    });

    const data = await response.json();
    let content = data.choices[0].message.content;

    if (!content) {
      appendMessage("ai", "No response from model.");
      return;
    }

    //從metadata中提取source字段，並去重
    const uniqueSources = [
      ...new Set(data.sources[0].metadata.map((item) => item.source)),
    ];

    console.log("Unique Sources:", uniqueSources);
    content += "\n ### 資料來源\n" + uniqueSources.join(", ");

    processAIResponse(content);
  } catch (error) {
    console.error("API Error:", error);
    appendMessage("ai", "Request failed. Please check API or CORS settings.");
  }
}

function appendMessage(role, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  scrollToBottom();
}

function processAIResponse(rawContent) {
  const aiContainer = document.createElement("div");
  aiContainer.className = "message ai";
  chatBox.appendChild(aiContainer);

  const mermaidRegex = /```mermaid([\s\S]*?)```/;
  const mermaidMatch = rawContent.match(mermaidRegex);
  const rawMarkdown = rawContent.replace(mermaidRegex, "").trim();

  if (rawMarkdown) {
    appendMarkdownMessage("ai", rawMarkdown);
  }

  if (!mermaidMatch) {
    aiContainer.remove();
    return;
  }

  aiContainer.textContent = "Rendering diagram...";

  const chartDiv = document.createElement("div");
  chartDiv.className = "mermaid";
  chartDiv.textContent = mermaidMatch[1].trim();
  chatBox.appendChild(chartDiv);
  aiContainer.remove();

  mermaid.run({ nodes: [chartDiv] });
  scrollToBottom();
}

function appendMarkdownMessage(role, rawMarkdown) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role} markdown-content`;
  msgDiv.innerHTML = marked.parse(rawMarkdown);
  chatBox.appendChild(msgDiv);
  scrollToBottom();
}

function scrollToBottom() {
  chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

if (modelSelect) {
  modelSelect.addEventListener("change", (e) => {
    MODEL_ID = e.target.value;
  });
}
