# OpenWebUI 開發步驟

## 1.PFAS法規資料庫

### 1.準備資料來源

檔案命名方式：**[頒布國家]_[頒布部會]_[關注議題1_關注議題2.....]\_[資料類別].pdf**

### 2.建立知識庫(Collection)

- 命名：**法規資料庫**
- 加入資料來源檔案

### 3.建立客製化模型

- 命名：**法規資料庫模型**
- 模型：gpt-5.4
- 知識庫：**法規資料庫**
- 系統提示詞：

```
# Role
你是一個專精於「全氟/多氟烷機物質(PFAS)法規」研究的資深分析師。你會根據「法規資料庫」中的資料提供專業、準確的解答。

# Output Requirements
**詳細回覆**：根據知識庫內容，以條列式或段落形式回答問題，確保資訊準確且包含關鍵數據。
```

### 4.開發流程

- 管理員控制台 -> 設定 -> 啟用 API 金鑰
- 設定 -> 帳號 -> API金鑰 -> 複製API金鑰
- 取得 OpenAI API金鑰
- 服務API（python)
- 前端網頁

### 5.服務API（python)

1. 取得指定的知識庫檔案清單function

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

- 取得指定的知識庫檔案清單

儲存至***PFAS_RULES_FILES*** List變數

```python
def get_knowledge_files(knowledge_id):
    # 取得特定知識庫的詳細內容
    url = f"{BASE_URL}/v1/knowledge/{knowledge_id}"
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        # 知識庫物件中的檔案通常在 'data' 或 'files' 欄位
        # 註：具體欄位可能隨版本變動，建議 print(data) 確認
        PFAS_RULES_FILES = data.get('knowledge', {}).get('data', {}).get('file_ids', [])

        print(f"知識庫 {knowledge_id} 中的檔案 ID 列表: {files}")
        return files
    else:
        print(f"無法取得知識庫資訊: {response.status_code}")

# 執行
# get_knowledge_files("your_knowledge_id_here")
```

2. 心智圖function

- 使用System Prompt

3. 表格function

- 使用System Prompt

4. 數據圖function

- 使用System Prompt

5. 資訊圖表function

- 使用OpenAI Image2 API

### 6.前端網頁

- 分三個區塊：查詢區、AI對話區、工具區
- **查詢區**

1. _查詢條件_(勾選可複選)

- 頒布國家：歐盟 臺灣 美國 日本 澳洲 加拿大 丹麥 德國 挪威 中國 波蘭 韓國 瑞典 其他
- 頒布部會：環境保護主管機關 衛生與公共健康主管機關 地方或州政府相關單位 其他跨部會協調機構 其他
- 關注議題：飲用水 食品 食品包材 化粧品 紡織品 消防泡沫 玩具 其他
- 資料類別：政策發布 法定規定 調查資料 風險溝通 毒理資訊 危害評估 產業資訊 技術替代 其他

2. _查詢結果檔案清單_

- 可勾選檔案，加入RAG參考檔案清單

3. _RAG參考檔案清單_

- 可刪除檔案，剩下檔案當作送至LM的參考資料

- **AI對話區**

1. _AI聊天訊息區塊_
2. _常用問題下拉選單_
3. _使用者提問輸入塊_

-- **工具區**

工具包含

- 心智圖 - 呼叫API function
- 表格 - 呼叫API function
- 數據圖 - 呼叫API function
- 資訊圖表 - 呼叫API function
- 匯出 - (JavaScript)AI聊天訊息區塊存檔至json
- 匯入 - (JavaScript)讀取json回填至聊天訊息區塊
