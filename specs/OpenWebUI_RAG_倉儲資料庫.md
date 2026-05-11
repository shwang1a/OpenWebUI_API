# OpenWebUI RAG客製化開發步驟

## 一、PFAS倉儲資料庫

以OpenWebUI為基底，建立知識庫模型，在開發客製化網頁，達到如NotebookLM之知識庫管理及分析效果

### 1. 文件準備

1. 檔案命名方式：依據原始檔案名稱
2. 檔案格式：

例如：

- PDF (.pdf)
- Word (.doc, .docx)
- Rich Text (.rtf)
- Markdown (.md)
- Text (.txt)
- HTML (.html)
- Excel (.xls, .xlsx)
- CSV (.csv)
- PowerPoint (.ppt, .pptx)

### 2. 建立知識庫(Collection)

- 命名：**PFAS倉儲知識庫**

處理流程

```
文件
  ↓
切塊（Chunking）
  ↓
Embedding
  ↓
存入 Vector DB
```

### 3. 建立客製化模型

- 命名：**PFAS倉儲知識庫模型**
- 模型：**gpt-5.4**
- 知識庫：**PFAS倉儲知識庫**
- 系統提示詞：

```
# Role
你是一個專精於「全氟/多氟烷機物質(PFAS)倉儲」研究的資深分析師。你會根據「PFAS倉儲知識庫」中的資料提供專業、準確的解答。

# Output Requirements
**詳細回覆**：根據知識庫內容，以條列式或段落形式回答問題，確保資訊準確且包含關鍵數據。
```

### 4. 開發流程

- 管理員控制台 -> 設定 -> 啟用 API 金鑰
- 設定 -> 帳號 -> API金鑰 -> 複製API金鑰
- 取得 OpenAI API金鑰
- 服務API（python)
- 前端網頁

### 5. 服務API（python)

1. **心智圖function**

- 使用Prompt

````python
let prompt = `
    根據以下摘要內容，以繁體中文生成一段 Mermaid 語法之專業心智圖 (Mindmap)。

    摘要內容：
    ${summary}

    # Mindmap Instructions
    - 使用 `mindmap` 標籤開始。
    - 根節點應為問題的核心主題。
    - 結構要清晰，層級分明。
    - 語法範例：
    ```mermaid
    mindmap
        root((核心主題))
        分支一
            細節A
            細節B
        分支二
            細節C

    ---
````

2. **表格function**

- 使用Prompt

```python
let prompt = `
    根據以下摘要內容，產生繁體中文專業資訊表格，必須將相關數據整理成 Markdown 表格，以便於快速比對。

    摘要內容：
    ${summary}

    # Table Formatting Rules
    - 使用標準 Markdown 表格格式。
    - **必備欄位**（視內容調整）：年份/期間、監測介質（如大氣、水質、土壤）、污染物種類（如 PCDD/Fs, PCBs, PFOS）、檢測平均值、單位（如 pg I-TEQ/m³ 或 ng/g）、倉儲標準/參考值。
    - 若知識庫中數據缺失，請在格位填入「-」並於表下註明。
    - 數據單位必須精確（注意 LaTeX 格式，例如 $pg/m^3$ 或 $ng/g$）。

    # Example Table Style
    | 年度 | 監測介質 | 污染物種類 | 監測平均值 | 單位 | 備註 (倉儲值) |
    | :--- | :--- | :--- | :--- | :--- | :--- |
    | 2022 | 環境大氣 | 戴奧辛 (PCDD/Fs) | 0.021 | $pg I-TEQ/m^3$ | 遠低於標準 (0.06) |
    | 2023 | 環境大氣 | 戴奧辛 (PCDD/Fs) | 0.019 | $pg I-TEQ/m^3$ | 呈現下降趨勢 |
`;

```

3. **數據圖function**

- 使用Prompt

````python
let prompt = `
    根據以下摘要內容，提取核心數據，並將複雜資訊轉化為易懂的圖表。

    摘要內容：
    ${summary}

    # Output Structure
    必須根據資料內容產出一個「視覺化資訊圖表」：
    - 使用 ```mermaid 代碼塊產出圖表。
    - 請根據內容屬性選擇最合適的類型（視內容調整）：
    - **部會權責/介質分布**：使用 `pie` (圓餅圖)。
    - **歷年趨勢/數據比較**：使用 `xychart-beta` (長條或折線圖)。
    - **檢測項目/檢測件數**：使用 `xychart-beta` (長條或折線圖)。
    - **倉儲演進/管制路徑**：使用 `graph TD` (流程圖)。
    - **物質分類/監測架構**：使用 `mindmap` (心智圖)。

    # Visualization Guidelines
    - 數據必須根據POPS 知識庫中的歷年成果報告的真實統計（例如：目前列管 34 種 POPs、跨部會推動架構等）。
    - 圖表標題應包含年份或具體主題。
    - 語法必須嚴謹，確保 Open WebUI 能正確渲染。

    # Mermaid Example for POPs (供模型參考)
    ## 範例：列管物質類別占比
    ```mermaid
    pie title 截至 2024 年底公約列管 POPs 種類 (計 34 種)
        "殺蟲劑" : 15
        "工業用化學物質" : 12
        "無意產生成分" : 7
`;

````

4. **資訊圖表function**

- 使用OpenAI Image2 API呼叫

```python
let prompt = `
    根據以下摘要內容，產生繁體中文專業資訊圖表；僅使用大號粗體清晰易讀的中文文字。盡量減少文字量。

    摘要內容：
    ${summary}

    風格：
    政府報告風格，正式專業，藍白配色

    要求：
    1. 高質感 infographic
    2. 清楚圖示
    3. 數據圖表(如果有數據的話，不要硬掰)
    4. 排版專業
    5. 長寬比設為 16:9
`;
```

### 6. 前端網頁

- 分二個區塊：AI對話區、工具區

#### AI對話區(width:80%)

1. **AI聊天訊息區塊**
2. **常用問題下拉選單**
3. **使用者提問輸入塊**

#### 工具區(width:20%)

工具按鈕包含

- 心智圖 - 呼叫API function
- 表格 - 呼叫API function
- 數據圖 - 呼叫API function
- 資訊圖表 - 呼叫API function
- 匯出 - (JavaScript function)AI聊天訊息區塊存檔至json
- 匯入 - (JavaScript function)讀取json回填至聊天訊息區塊

### 7. PFAS法規RAG開發資訊圖表

![PFAS倉儲RAG開發資訊圖表](<infographic(PFAS倉儲).png> "PFAS倉儲RAG開發資訊圖表")
