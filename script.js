mermaid.initialize({ startOnLoad: false, theme: "default" });

const CONFIG = {
  API_KEY: "sk-0272fcf92eb543d7bf1ae39f29f2d2d5",
  BASE_URL: "https://webui.igis.com.tw/api",
};

let MODEL_ID = "pops_\u5fc3\u88fd\u5716";

const chatBox = document.getElementById("chat-box");
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const pdfBtn = document.getElementById("pdfBtn");
const modelSelect = document.getElementById("modelSelect");

function formatMessageTime(date = new Date()) {
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

async function exportChatToPDF() {
  if (!chatContainer || !window.html2canvas || !window.jspdf) {
    alert("PDF 匯出功能尚未就緒");
    return;
  }

  const originalScrollTop = chatContainer.scrollTop;
  const originalStyle = {
    height: chatContainer.style.height,
    maxHeight: chatContainer.style.maxHeight,
    overflow: chatContainer.style.overflow,
  };

  try {
    chatContainer.scrollTop = 0;
    chatContainer.style.height = `${chatContainer.scrollHeight}px`;
    chatContainer.style.maxHeight = "none";
    chatContainer.style.overflow = "visible";

    const pageBreakSelectors = [
      "#chat-box > *",
      ".message",
      ".message > *",
      ".message li",
      ".message pre",
      ".message table",
      ".mermaid",
      "svg",
    ];
    const breakPoints = new Set([0, chatContainer.scrollHeight]);

    pageBreakSelectors.forEach((selector) => {
      chatContainer.querySelectorAll(selector).forEach((element) => {
        const top = element.offsetTop;
        const bottom = top + element.offsetHeight;
        if (element.offsetHeight > 0) {
          breakPoints.add(top);
          breakPoints.add(bottom);
        }
      });
    });

    const sortedBreakPoints = Array.from(breakPoints)
      .filter((point) => point >= 0)
      .sort((a, b) => a - b);

    const canvas = await html2canvas(chatContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: chatContainer.scrollWidth,
      windowHeight: chatContainer.scrollHeight,
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const imgWidth = usableWidth;
    const pxPerMm = canvas.width / usableWidth;
    const pageCanvasHeight = Math.floor(usableHeight * pxPerMm);

    let renderedHeight = 0;
    let pageIndex = 0;

    while (renderedHeight < canvas.height) {
      const remainingHeight = canvas.height - renderedHeight;
      let targetHeight = Math.min(pageCanvasHeight, remainingHeight);

      if (remainingHeight > pageCanvasHeight) {
        const maxBoundary = sortedBreakPoints.filter(
          (point) =>
            point > renderedHeight &&
            point <= renderedHeight + pageCanvasHeight,
        );
        const bestBreakPoint = maxBoundary.length
          ? maxBoundary[maxBoundary.length - 1]
          : renderedHeight + pageCanvasHeight;

        if (bestBreakPoint > renderedHeight) {
          targetHeight = bestBreakPoint - renderedHeight;
        }
      }

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = targetHeight;

      const sliceContext = sliceCanvas.getContext("2d");
      sliceContext.drawImage(
        canvas,
        0,
        renderedHeight,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height,
      );

      const sliceData = sliceCanvas.toDataURL("image/png");
      const sliceHeightMm = (sliceCanvas.height * imgWidth) / sliceCanvas.width;

      if (pageIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(sliceData, "PNG", margin, margin, imgWidth, sliceHeightMm);
      renderedHeight += sliceCanvas.height;
      pageIndex += 1;
    }

    pdf.save("chat-export.pdf");
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("PDF 匯出失敗，請稍後再試");
  } finally {
    chatContainer.style.height = originalStyle.height;
    chatContainer.style.maxHeight = originalStyle.maxHeight;
    chatContainer.style.overflow = originalStyle.overflow;
    chatContainer.scrollTop = originalScrollTop;
  }
}

function generatePPT(fullText) {
  // 1. 擷取 [報頭] 到 [報尾] 之間的內容
  const contentMatch = fullText.match(/\[報頭\]([\s\S]*?)\[報尾\]/);
  if (!contentMatch) {
    alert("找不到 [報頭] 或 [報尾] 標籤");
    return;
  }
  const mainContent = contentMatch[1];

  // 2. 初始化 PptxGenJS
  let pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  // 2. 切分頁面 (根據 --- 符號)
  const pages = mainContent.split("---");

  pages.forEach((pageContent, index) => {
    let slide = pptx.addSlide();

    // 提取標題 (假設格式為 ### 第X頁｜標題)
    const titleMatch = pageContent.match(/### .*?｜(.*)/);
    const titleText = titleMatch
      ? titleMatch[1].trim()
      : "簡報頁 " + (index + 1);

    // 提取講稿 (備註欄)
    const noteMatch = pageContent.match(/\*\*講稿：\*\*([\s\S]*)/);
    const notes = noteMatch ? noteMatch[1].trim() : "";

    // 設定標題樣式
    slide.addText(titleText, {
      x: 0.5,
      y: 0.5,
      w: "90%",
      h: 1,
      fontSize: 32,
      bold: true,
      color: "363636",
      valign: "middle",
    });

    // 提取主體內容 (過濾掉標題和講稿的部分)
    let bodyContent = pageContent
      .replace(/### .*/, "") // 刪除標題行
      .replace(/\*\*講稿：\*\*[\s\S]*/, "") // 刪除講稿部分
      .replace(/\*\*(.*?)\*\*/g, "$1") // 去除粗體 Markdown 標籤
      .trim();

    // 將內容按行分割並處理成條目
    let lines = bodyContent.split("\n").filter((line) => line.trim() !== "");

    if (index === 0) {
      // 第一頁特殊處理：標題頁佈局
      slide.addText(bodyContent, {
        x: 0.5,
        y: 2,
        w: "90%",
        h: 3,
        fontSize: 20,
        align: "center",
        color: "666666",
      });
    } else {
      // 普通頁：清單佈局（支援階層與樣式）
      let bulletPoints = lines.map((line) => {
        const rawLine = line.replace(/\t/g, "    ");
        const indentSpaces = (rawLine.match(/^(\s*)/) || ["", ""])[1].length;
        const level = Math.min(Math.floor(indentSpaces / 2), 4);

        const text = rawLine
          .trim()
          .replace(/^[-*+]\s+/, "")
          .replace(/^\d+\.\s+/, "")
          .trim();

        return {
          text,
          options: {
            bullet: { indent: 16 + level * 18 },
            margin: [8 + level * 14, 4, 0, 3],
            breakLine: true,
            bold: level === 0,
            fontSize: level === 0 ? 22 : level === 1 ? 18 : 16,
            color: level === 0 ? "222222" : level === 1 ? "444444" : "666666",
          },
        };
      });

      slide.addText(bulletPoints, {
        x: 0.7,
        y: 1.5,
        w: 8.8,
        h: 4.8,
        valign: "top",
        paraSpaceAfterPt: 8,
        breakLine: false,
      });
    }

    // 加入講稿到備註欄 (Notes)
    slide.addNotes(notes);
  });

  // 4. 下載檔案
  pptx.writeFile({ fileName: "POPs_Report.pptx" });
}

/**
 * 語音合成（非 Streaming）
 */
async function generateSpeech(textSpeech) {
  const url = CONFIG.BASE_URL + "/v1/audio/speech";
  const apiKey = CONFIG.API_KEY; // 建議將 Key 放在環境變數

  const payload = {
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

  const modeltext = modelSelect.options[modelSelect.selectedIndex].text;
  let fullContent = `### 🤖 【${modeltext}】`;
  let sources = [];
  let tool_ids = [];

  if (modelSelect) {
    MODEL_ID = modelSelect.value;
    // switch (MODEL_ID) {
    //   case "pops_簡報":
    //     tool_ids = ["export_to_pptx"];
    //     text += "，製作簡報";
    //     break;
    //   case "pops_mp3":
    //     tool_ids = ["export_to_mp3"];
    //     text += "，下載音檔";
    //     break;
    //   default:
    //     tool_ids = [];
    // }
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

    // 根據最終內容決定是否顯示功能按鈕
    processFunctions(MODEL_ID, fullContent);
  } catch (error) {
    console.error("API Error:", error);
    appendMessage("ai", "Streaming failed. Please check API or network.");
  }
}

/**
 *  根據內容決定是否顯示功能按鈕（如 Export to MP3 / PPTX）
 * @param {string} MODEL_ID
 * @param {string} fullContent
 */
function processFunctions(MODEL_ID, fullContent) {
  // 建立 功能按鈕列容器
  const funcDiv = document.createElement("div");
  funcDiv.className = "function-buttons";
  chatBox.appendChild(funcDiv);

  // 新增 Export to MP3 功能按鈕
  const mp3Btn = document.createElement("button");
  mp3Btn.className = "mp3-btn";
  mp3Btn.textContent = "語音檔";
  mp3Btn.onclick = () => generateSpeech(fullContent);
  funcDiv.appendChild(mp3Btn);

  if (MODEL_ID === "popsmarkdown") {
    // 新增 Export to PPTX 功能按鈕
    const pptxBtn = document.createElement("button");
    pptxBtn.className = "pptx-btn";
    pptxBtn.textContent = "簡報檔";
    pptxBtn.onclick = () => generatePPT(fullContent);
    funcDiv.appendChild(pptxBtn);
  }
}

/**
 * 一般訊息（純文字）
 */
function appendMessage(role, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;
  msgDiv.textContent = `👦 ` + text;
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

if (pdfBtn) {
  pdfBtn.addEventListener("click", exportChatToPDF);
}

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
