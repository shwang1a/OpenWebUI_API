# OpenWebUI RAG客製化開發步驟

## 一、PFAS法規資料庫

以OpenWebUI為基底，建立知識庫模型，在開發客製化網頁，達到如NotebookLM之知識庫管理及分析效果

### 1. 文件準備

1. 檔案命名方式：**[頒布國家]\_[頒布部會]\_[資料類別]\_[法規中文].pdf**

例如：

- 臺灣\_環境部\_其他\_水中全氟與多氟烷基物質檢測方法－液相層析串聯式質譜儀法.pdf
- 臺灣\_環境部\_法定規定\_飲用水水質標準.pdf

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

- 命名：**PFAS法規知識庫**

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

- 命名：**PFAS法規知識庫模型**
- 模型：**gpt-5.4**
- 知識庫：**PFAS法規知識庫**
- 系統提示詞：

```
# Role
你是一個專精於「全氟/多氟烷機物質(PFAS)法規」研究的資深分析師。你會根據「PFAS法規知識庫」中的資料提供專業、準確的解答。

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

1. **取得指定的知識庫檔案清單function**

```python
def get_knowledge_files(knowledge_id)->list:
    # 取得特定知識庫的詳細內容
    url = f"{BASE_URL}/v1/knowledge/{knowledge_id}"
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        # 知識庫物件中的檔案通常在 'data' 或 'files' 欄位
        # 註：具體欄位可能隨版本變動，建議 print(data) 確認
        files = data.get('knowledge', {}).get('data', {}).get('file_ids', [])

        print(f"知識庫 {knowledge_id} 中的檔案 ID 列表: {files}")
        return files
    else:
        print(f"無法取得知識庫資訊: {response.status_code}")

# 執行
# get_knowledge_files("your_knowledge_id_here")
```

#### 額外參考：

- 列出所有可選模型清單

```powershell
curl -X GET "http://localhost:3000/api/models" \
     -H "Authorization: Bearer <YOUR_API_KEY>" \
     -H "Content-Type: application/json"
```

- 取得指定模型的上傳知識庫 (Knowledge) 清單

```powershell
curl -X GET "http://localhost:3000/api/models/model/{model_id}" \
     -H "Authorization: Bearer <YOUR_API_KEY>" \
     -H "Content-Type: application/json"
```

2. **心智圖function**

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

3. **表格function**

- 使用Prompt

```python
let prompt = `
    根據以下摘要內容，產生繁體中文專業資訊表格，必須將相關數據整理成 Markdown 表格，以便於快速比對。

    摘要內容：
    ${summary}

    # Table Formatting Rules
    - 使用標準 Markdown 表格格式。
    - **必備欄位**（視內容調整）：年份/期間、監測介質（如大氣、水質、土壤）、污染物種類（如 PCDD/Fs, PCBs, PFOS）、檢測平均值、單位（如 pg I-TEQ/m³ 或 ng/g）、法規標準/參考值。
    - 若知識庫中數據缺失，請在格位填入「-」並於表下註明。
    - 數據單位必須精確（注意 LaTeX 格式，例如 $pg/m^3$ 或 $ng/g$）。

    # Example Table Style
    | 年度 | 監測介質 | 污染物種類 | 監測平均值 | 單位 | 備註 (法規值) |
    | :--- | :--- | :--- | :--- | :--- | :--- |
    | 2022 | 環境大氣 | 戴奧辛 (PCDD/Fs) | 0.021 | $pg I-TEQ/m^3$ | 遠低於標準 (0.06) |
    | 2023 | 環境大氣 | 戴奧辛 (PCDD/Fs) | 0.019 | $pg I-TEQ/m^3$ | 呈現下降趨勢 |
`;

```

4. **數據圖function**

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
    - **法規演進/管制路徑**：使用 `graph TD` (流程圖)。
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

5. **資訊圖表function**

- 使用OpenAI Image2 API呼叫

```python
let prompt = `
    根據以下摘要內容，產生繁體中文專業資訊圖表。

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

6. **綜合摘要function**

```python
    let prompt = `
    你是一位PFAS法規與環境風險分析專家。

    請根據以下AI對話內容，
    產生一份「PFAS法規綜合摘要報告」。

    # AI對話內容
    ${chatHistory}

    # Output Requirements

    請使用繁體中文。

    請輸出專業、正式、政府研究報告風格。

    摘要內容需包含：

    # 報告格式

    ## 一、核心結論
    - 條列本次分析最重要的結論
    - 說明主要法規方向

    ## 二、重要法規重點
    - 整理提及的重要法規
    - 包含國家、主管機關、法規名稱、重點內容

    ## 三、跨國差異分析
    - 比較不同國家PFAS管制差異
    - 說明限制標準、管制方向、適用範圍

    ## 四、關鍵數據整理
    - 整理重要數據與監測資訊
    - 若有數值請保留原始單位

    ## 五、風險與影響
    - 說明環境風險
    - 人體健康風險
    - 產業衝擊

    ## 六、未來趨勢
    - 推估未來PFAS法規發展方向
    - 說明可能新增之限制

    ## 七、建議事項
    - 提供政府、企業、研究單位可能的因應建議

    # Requirements
    - 若資料不足，不可虛構
    - 必須根據對話內容整理
    - 保持專業性
    - 使用 Markdown 格式
`;

```

### 6. 前端網頁

- 分三個區塊：查詢區(左)、AI對話區(中)、工具區(右)

#### 查詢區

1. **查詢條件**(width:30%)

- 頒布國家：(可複選)歐盟 臺灣 美國 日本 澳洲 加拿大 丹麥 德國 挪威 中國 波蘭 韓國 瑞典 其他
- 頒布部會：(可複選)環境保護主管機關 衛生與公共健康主管機關 地方或州政府相關單位 其他跨部會協調機構 其他
- 資料類別：(可複選)政策發布 法定規定 調查資料 風險溝通 毒理資訊 危害評估 產業資訊 技術替代 其他
- 查詢按鈕：呼叫服務API-取得指定的知識庫檔案清單function,將檔案清單填入**2. 查詢結果檔案清單**

2. **查詢結果檔案清單**(width:60%)

- (可複選)檔案清單
- 加入按鈕：將勾選檔案加入至**3. 提示詞參考檔案清單**

3. **提示詞參考檔案清單**(width:10%)

- 可刪除檔案，剩下檔案當作{AI對話區}使用者提問提示詞的參考檔案資料

#### AI對話區

1. **AI聊天訊息區塊**
2. **常用問題下拉選單**
3. **使用者提問輸入塊**

#### 工具區

工具按鈕包含

- 心智圖 - 呼叫API function
- 表格 - 呼叫API function
- 數據圖 - 呼叫API function
- 資訊圖表 - 呼叫API function
- 綜合栽要 - 呼叫API function
- 匯出 - (JavaScript function)AI聊天訊息區塊存檔至json
- 匯入 - (JavaScript function)讀取json回填至聊天訊息區塊

### 7. PFAS法規RAG開發資訊圖表

```
請依據這份.md文件
#要求
1. 畫出 UML 流程圖
2. 為了確保開發過程的嚴謹性，詳述完整開發邏輯架構。
3. 高質感 infographic
4. 清楚圖示
5. 數據圖表
6. 排版專業
7. 將長寬比設為 16:9
```

![PFAS法規RAG開發資訊圖表](ChatGPT%20Image%202026年5月10日%20下午05_05_15.png "PFAS法規RAG開發資訊圖表")

```
請依據這份.md文件，提供專業、詳實準確的資訊圖表。
#要求
1. 畫出 UML 流程圖
2. 為了確保開發過程的嚴謹性，詳述完整開發邏輯架構。
3. 高質感 infographic
4. 清楚圖示
5. 數據圖表(內容沒有數據就不要畫出)
6. 排版專業 7. 將長寬比設為 16:9
```

![PFAS法規RAG開發資訊圖表](<ChatGPT%20Image%202026年5月10日%20下午08_08_03%20(2).png> "PFAS法規RAG開發資訊圖表")

![PFAS法規RAG開發資訊圖表](<infographic(PFAS法規).png> "PFAS法規RAG開發資訊圖表")
