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

/**
 * 語音合成示範（非 Streaming）
 */
async function generateSpeech(textSpeech) {
  const url = CONFIG.BASE_URL + "/v1/audio/speech";
  const apiKey = CONFIG.API_KEY; // 建議將 Key 放在環境變數

  const payload = {
    model: "tts-1",
    input: textSpeech,
    voice: "alloy",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
    }

    // 處理二進位流 (Blob)
    const blob = await response.blob();

    // 建立一個暫時的 URL 並自動下載
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "speech.mp3";
    document.body.appendChild(a);
    a.click();

    // 清理記憶體
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();

    console.log("語音下載成功！");
  } catch (error) {
    console.error("發生錯誤:", error);
  }
}

/**
 * 發送訊息（Streaming版）
 */
async function sendMessage() {
  let text = userInput.value.trim();
  if (!text) return;

  let fullContent = "";
  let sources = [];
  let tool_ids = [];

  if (modelSelect) {
    MODEL_ID = modelSelect.value;
    switch (MODEL_ID) {
      case "pops_簡報":
        tool_ids = ["export_to_pptx"];
        text += "，製作簡報";
        break;
      case "pops_mp3":
        tool_ids = ["export_to_mp3"];
        text += "，下載音檔";
        break;
      default:
        tool_ids = [];
    }
  }

  appendMessage("user", text);
  userInput.value = "";

  // 建立 AI 訊息容器（即時更新）
  const aiDiv = document.createElement("div");
  aiDiv.className = "message ai markdown-content";
  chatBox.appendChild(aiDiv);

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
        tool_ids: tool_ids, // ✅ 傳入工具 ID
        tool_servers: [],
        stream: true, // ✅ 開啟 streaming
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");

      for (let line of lines) {
        line = line.trim();

        if (!line.startsWith("data:")) continue;

        const jsonStr = line.replace("data:", "").trim();

        if (jsonStr === "[DONE]") break;

        try {
          const chunk = JSON.parse(jsonStr);

          // 取得文字 delta
          const delta =
            chunk.choices?.[0]?.delta?.content ||
            chunk.choices?.[0]?.message?.content ||
            "";

          if (delta) {
            fullContent += delta;

            // 即時 render markdown（打字效果）
            aiDiv.innerHTML = marked.parse(fullContent);
            scrollToBottom();
          }

          // 取得 sources（通常最後才會出現）
          if (chunk.sources) {
            sources = chunk.sources;
          }
        } catch (err) {
          console.warn("Chunk parse error:", err, jsonStr);
        }
      }

      // 保留未完整解析的片段
      buffer = lines[lines.length - 1];
    }

    // ===== Streaming 完成後 =====

    // 處理 sources
    if (sources.length > 0) {
      try {
        const uniqueSources = [
          ...new Set(sources[0].metadata.map((item) => item.source)),
        ];

        // 組成 [1] file1 格式
        const formattedSources = uniqueSources
          .map((src, idx) => `+ [${idx + 1}] ${src}`)
          .join("\n");

        fullContent += "\n\n### 資料來源\n" + formattedSources;
        aiDiv.innerHTML = marked.parse(fullContent);
      } catch (e) {
        console.warn("Sources parse error:", e);
      }
    }

    // 處理 mermaid
    processMermaid(fullContent);

    // 建立 功能按鈕列容器
    const funcDiv = document.createElement("div");
    funcDiv.className = "function-buttons";
    aiDiv.appendChild(funcDiv);

    // 新增 Export to MP3 功能按鈕
    const mp3Btn = document.createElement("button");
    mp3Btn.textContent = "Export to MP3";
    mp3Btn.onclick = () => generateSpeech(fullContent);
    funcDiv.appendChild(mp3Btn);
  } catch (error) {
    console.error("API Error:", error);
    appendMessage("ai", "Streaming failed. Please check API or network.");
  }
}

/**
 * 一般訊息（純文字）
 */
function appendMessage(role, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  scrollToBottom();
}

/**
 * 處理 Mermaid 圖表
 */
function processMermaid(rawContent) {
  const mermaidRegex = /```mermaid([\s\S]*?)```/;
  const mermaidMatch = rawContent.match(mermaidRegex);

  if (!mermaidMatch) return;

  const chartDiv = document.createElement("div");
  chartDiv.className = "mermaid";
  chartDiv.textContent = mermaidMatch[1].trim();

  chatBox.appendChild(chartDiv);
  mermaid.run({ nodes: [chartDiv] });
  scrollToBottom();
}

/**
 * 滾動到底
 */
function scrollToBottom() {
  chatBox.parentElement.scrollTop = chatBox.parentElement.scrollHeight;
}

/**
 * 事件綁定
 */
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
