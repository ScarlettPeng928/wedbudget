# WedBudget 文字設計規範

整個網站的文字只用下面這套規範：**3 種字體、7 級字級、4 種字重**。
新增或修改畫面時，先從這裡挑，不要另外寫 `text-[23px]` 這類自訂數字。

字級的實際數值定義在 [`src/input.css`](../src/input.css) 的 `@theme` 裡，改那裡就會全站一起更新。

---

## 1. 字體

| 字體 | Tailwind class | 用途 | 個性 |
|---|---|---|---|
| **Gambetta**（襯線） | `font-serif` | 標題、故事文字、Hero 的 CTA | 優雅、有溫度，負責「情感」 |
| **General Sans**（無襯線） | `font-sans`（預設） | 內文、說明、按鈕、導覽、標籤 | 乾淨、好讀，負責「資訊」 |
| **Italiana**（展示字） | `font-display` | **只用在 logo「WEDBUDGET」** | 品牌識別 |

**原則：襯線講情感，無襯線講資訊。** 同一個區塊裡，標題用襯線、說明用無襯線。

---

## 2. 字級

每一級都會隨螢幕寬度縮放：手機用最小值，大螢幕用最大值，中間平滑變化。
一個 class 同時設定**字級和行高**。

| Class | 手機 → 桌機 | 行高 | 字體 | 用在哪裡 |
|---|---|---|---|---|
| `text-display` | 32 → 56px | 1.12 | serif | **整頁最大的一句**：Hero 主標題。一頁只有一個 |
| `text-title` | 28 → 44px | 1.15 | serif | **區塊標題**：「Where your budget goes.」、說明區的「Start with one number.」、結尾標語、Hero 的「Begin my plan」 |
| `text-statement` | 22 → 34px | 1.3 | serif | **需要慢慢讀的大段文字**：Story 的四行故事；選單的主要連結（sans） |
| `text-lead` | 16 → 20px | 1.6 | sans | **介紹一個區塊的短段落**：區塊副標、說明區的內文、Hero 副標；選單的分類連結 |
| `text-body` | 15 → 17px | 1.6 | sans | **一般內文**：表單說明、長段落 |
| `text-small` | 13 → 15px | 1.5 | sans | **補充資訊**：卡片上的「55% of your budget」、footer 連結、版權宣告 |
| `text-label` | 11 → 13px | 1.4 | sans | **全大寫標籤**：按鈕、導覽列、卡片的分類名稱、footer 的欄位標題 |

### 怎麼挑字級
- 這段文字是**整頁的主角**嗎？→ `display`（一頁只有一個）
- 是**一個區塊的標題**嗎？→ `title`
- 是**要被逐字閱讀、帶情緒的句子**嗎？→ `statement`
- 是**標題下面那段說明**嗎？→ `lead`
- 是**一般說明文字**嗎？→ `body`
- 是**附帶的小資訊**嗎？→ `small`
- 是**按鈕或全大寫的小標**嗎？→ `label`

### 相鄰兩級的差距
相鄰的兩級之間大約差 1.25～1.5 倍，例如 title 44px 和 statement 34px。差距太小，看起來像排版沒對齊；差距太大，畫面會斷裂。**不要在兩級之間自己發明一個中間值。**

---

## 3. 字重

| 字重 | Class | 用在哪裡 |
|---|---|---|
| Light 300 | `font-light` | **所有襯線標題**（display / title / statement）。細線條讓大字顯得輕盈優雅。疊在影片或照片上的 sans 副標也用 light |
| Regular 400 | 預設，不用寫 | **所有 sans 文字**：內文、標籤、按鈕 |
| Semibold 600 | `font-semibold` | **只用在強調字**：在細斜體標題裡，挑一兩個關鍵字改成直立粗體 |
| Bold 700 | — | **不使用**。在這套細緻的風格裡太重了 |

### 強調字的手法
在細的斜體句子裡，把關鍵字改成**直立 + 粗體**，例如：

- Hero：*Your* **budget,** *beautifully planned.*
- Story：*Every love story deserves its* **own day.**

寫法：`<strong className="font-semibold not-italic">`。
**一句話最多強調一處**，強調太多就等於沒有強調。

---

## 4. 斜體

- **斜體只用在襯線字**，而且只用在標題和故事文字（Hero 標題、Story、說明區標題、「Begin my plan」）。
- **sans 不用斜體**，資訊類的文字要直立才好讀。

---

## 5. 字距（letter-spacing）

| 情況 | 字距 | 寫法 |
|---|---|---|
| 全大寫的文字（`text-label` + `uppercase`） | **5%** | `tracking-[0.05em]` |
| Logo「WEDBUDGET」 | 5% | `tracking-[0.05em]` |
| Hero 副標（疊在影片上） | 5% | `tracking-[0.05em]` |
| 大尺寸的襯線標題 | **0**（不加） | — |
| 一般內文 | 0（不加） | — |

**原則：小字和全大寫要加字距，大的襯線字不加。** 大字加字距，字母之間會鬆掉，尤其斜體的流暢感會被打斷。

---

## 6. 顏色搭配

| 背景 | 主要文字 | 次要文字 |
|---|---|---|
| 淺色（cream / oat / linen） | `text-plum` | `text-cocoa` |
| 深色（plum、影片、照片） | `text-sand` | `text-sand/75`（不要低於 75%，不然對比不夠） |

Story 的逐字亮起是例外：從 `rosewood`（還沒亮）變成 `sand`（亮起）。

---

## 7. 例外

- **Logo** 用 `font-display`，大小各自設定（header 22～32px、footer 26～36px），不套用字級。
- **Intro 開場的 logo** 也是例外，屬於品牌展示。

---

## 8. 目前的套用狀態

| 範圍 | 狀態 |
|---|---|
| 首頁所有區塊（Hero、Story、分類卡片、說明區、結尾） | ✅ 已套用 |
| Header、選單、Footer | ✅ 已套用（logo 除外） |
| 規劃頁（PlanPage、PlanForm） | ⏳ 尚未套用 |
| 結果頁（ResultsPage、BudgetAllocation、VendorCarousel） | ⏳ 尚未套用 |
| 廠商頁（VendorsPage、VendorCard）、404 頁 | ⏳ 尚未套用 |

尚未套用的頁面，還是用 `text-[clamp(...)]` 這類個別寫死的數字，之後要逐一換成上面的 class。
