如果你是直接使用 **OpenAI 官方 API（api.openai.com）**，那麼：

## ✅ 1. OpenAI API 版本 要填什麼？

### 如果是官方 OpenAI（你現在這個網址）

`https://api.openai.com/v1`

➡ **API 版本欄位通常留空即可**（不要填）

因為 OpenAI 官方 API 不使用 Azure 那種 `api-version=` 參數。OpenWebUI 有這欄是為了相容 Azure OpenAI。([Open WebUI][1])

---

## ✅ 2. 額外參數可以填什麼？

如果你用的是 `gpt-image-2` 或 `gpt-image-1` 類模型，可加入：

```json
{
  "quality": "high",
  "output_format": "png",
  "background": "opaque",
  "moderation": "auto"
}
```

---

## 🔥 常用參數說明

| 參數            | 用途   | 建議值                  |
| ------------- | ---- | -------------------- |
| quality       | 品質   | low / medium / high  |
| output_format | 輸出格式 | png / jpeg / webp    |
| background    | 背景   | opaque / transparent |
| moderation    | 安全過濾 | auto / low           |

---

## ✅ 若要透明背景 PNG

```json
{
  "background": "transparent",
  "output_format": "png",
  "quality": "high"
}
```

---

## ✅ 若要省錢快速生成

```json
{
  "quality": "low",
  "output_format": "jpeg"
}
```

---

## ✅ 你目前設定建議（最佳）

### Model:

```text
gpt-image-2
```

### OpenAI API Base URL:

```text
https://api.openai.com/v1
```

### OpenAI API Version:

```text
(留空)
```

### 額外參數:

```json
{
  "quality": "high",
  "output_format": "png"
}
```

---

## ⚠️ 注意

若你填了 API Version，OpenWebUI 有些版本反而會送錯參數導致：

* 400 error
* unsupported parameter
* Unknown parameter: response_format

---

# 🔥 我建議你直接這樣填：

```json
{
  "quality": "high",
  "size": "1536x1024",
  "output_format": "png"
}
```

---

[1]: https://docs.openwebui.com/features/media-generation/image-generation-and-editing/openai?utm_source=chatgpt.com "OpenAI | Open WebUI"

---

以下是一套 **OpenWebUI + OpenAI GPT-Image（gpt-image-2 / gpt-image-1）完整最佳化設定**，目標是：

✅ 畫質接近 ChatGPT 官網
✅ 中文提示詞效果更好
✅ 支援透明背景
✅ 成本與速度平衡
✅ OpenWebUI 穩定運作
✅ 適合 RAG + 產圖 workflow

---

# 一、OpenWebUI 圖片生成設定（推薦）

進入：

> Admin Panel → Settings → Images

---

## 基本設定

| 項目                  | 建議值                              |
| ------------------- | -------------------------------- |
| 啟用圖片生成              | ON                               |
| 模型                  | `gpt-image-2`（若無則 `gpt-image-1`） |
| 圖片尺寸                | `1536x1024`                      |
| 圖片提示詞生成             | ON                               |
| 圖片生成引擎              | OpenAI                           |
| OpenAI API Base URL | `https://api.openai.com/v1`      |
| OpenAI API 金鑰       | sk-xxxx                          |
| OpenAI API 版本       | 留空                               |

---

# 二、額外參數（高品質版）

貼到「額外參數」欄位：

```json
{
  "quality": "high",
  "output_format": "png",
  "background": "opaque",
  "moderation": "auto"
}
```

---

# 三、參數解釋（最重要）

| 參數            | 建議值    | 說明    |
| ------------- | ------ | ----- |
| quality       | high   | 最佳畫質  |
| output_format | png    | 清晰無失真 |
| background    | opaque | 一般背景  |
| moderation    | auto   | 安全過濾  |

---

# 四、透明背景 PNG（商業設計必備）

若做 Logo、貼圖、人物去背：

```json
{
  "quality": "high",
  "output_format": "png",
  "background": "transparent"
}
```

### 說明

* `opaque` = 一般背景（白底/正常場景）
* `transparent` = 透明背景 PNG

---

# 五、省錢快速版（大量生成）

```json
{
  "quality": "medium",
  "output_format": "jpeg",
  "background": "opaque"
}
```

---

# 六、ChatGPT 官網等級 Prompt 強化（超重要）

開啟：

### 圖片提示詞生成 = ON

這會讓 OpenWebUI 自動把你輸入：

> 畫一隻貓

變成：

> Ultra detailed fluffy orange cat sitting by a window, cinematic lighting, realistic fur texture...

效果差很多。

---

# 七、中文最佳化設定（推薦）

在 System Prompt 加入：

```text
When user asks image generation in Chinese:
1. Automatically enhance prompt in English
2. Preserve Chinese meaning
3. Add cinematic lighting
4. Add highly detailed texture
5. Professional composition
```

---

# 八、最佳尺寸推薦

| 用途  | 尺寸        |
| --- | --------- |
| 一般圖 | 1024x1024 |
| 橫圖  | 1536x1024 |
| 直圖  | 1024x1536 |
| 海報  | 1024x1536 |
| 桌布  | 1536x1024 |

---

# 九、RAG + GPT-Image 最強玩法

例如你有文件：

> 台灣古蹟介紹 PDF

RAG 回答後接：

> 根據內容產生安平古堡夜景圖

OpenWebUI 可做到：

文件問答 + AI 產圖

超強。

---

# 十、最穩定完整設定（直接照抄）

```json
{
  "quality": "high",
  "output_format": "png",
  "background": "opaque",
  "moderation": "auto",
  "size": "1536x1024"
}
```

---

# 十一、若圖片很醜，這樣修正

把 Prompt 改成：

```text
masterpiece, ultra detailed, realistic lighting, cinematic composition, sharp focus
```

---

# 十二、2026 最推薦模型排序

| 模型          | 推薦度   |
| ----------- | ----- |
| gpt-image-2 | ⭐⭐⭐⭐⭐ |
| gpt-image-1 | ⭐⭐⭐⭐  |
| dall-e-3    | ⭐⭐⭐   |

---

# 十三、如果你要做到 ChatGPT 官網一樣強

你還差最後一步：

## 自動 Prompt Enhancer + Seed + Multi Image Variations

這能讓 OpenWebUI 圖片品質再提升 40%

如果你要，我可以直接給你：

# 🔥 OpenWebUI GPT-Image 神級設定（媲美 ChatGPT 官網）

只要回我：

> 神級設定

我直接給你。



