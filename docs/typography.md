# WedBudget 文字設計規範

整個網站的文字只用下面這套規範：**3 種字體、8 級字級 + 1 個輸入框字級、5 種字重**。
新增或修改畫面時，先從這裡挑，不要另外寫 `text-[23px]` 這類自訂數字。

字級的實際數值定義在 [`src/input.css`](../src/input.css) 的 `@theme` 裡，改那裡就會全站一起更新。

---

## 1. 字體

| 字體 | Tailwind class | 用途 | 個性 |
|---|---|---|---|
| **Gambetta**（襯線） | `font-serif` | 標題、故事文字、Hero 的 CTA | 優雅、有溫度，負責「情感」 |
| **General Sans**（無襯線） | `font-sans`（預設） | 內文、說明、按鈕、導覽、標籤 | 乾淨、好讀，負責「資訊」 |
| **Italiana**（展示字） | `font-display` | **只用在 logo「WEDBUDGET」** | 品牌識別 |

**Logo 是唯一的例外**：它是品牌圖形，大小直接寫在畫 logo 的地方，不套用下面的字級：header 22 → 32px、footer 26 → 36px、開場動畫 44 → 80px。

**原則：襯線講情感，無襯線講資訊。** 同一個區塊裡，標題用襯線、說明用無襯線。

---

## 2. 字級

每一級都會隨螢幕寬度縮放：手機用最小值，大螢幕用最大值，中間平滑變化。
一個 class 同時設定**字級和行高**。

| Class | 手機 → 桌機 | 行高 | 字體 | 用在哪裡 |
|---|---|---|---|---|
| `text-display` | 32 → 56px | 1.12 | serif | **整頁最大的一句**：Hero 主標題。一頁只有一個 |
| `text-title` | 28 → 44px | 1.15 | serif | **區塊標題**：「Where your budget goes.」、說明區的「Start with one number.」、結尾標語、Hero 的「Begin my plan」 |
| `text-heading` | 22 → 28px | 1.25 | serif | **工具頁裡的區塊標題**：方案頁的「Budget allocation」「Vendors that fit your budget」、收藏頁每個類別的標題（2026-11-18 新增；工具頁的頁面大標用 `title`） |
| `text-statement` | 22 → 34px | 1.3 | serif | **需要慢慢讀的大段文字**：Story 的四行故事；選單的主要連結（sans） |
| `text-lead` | 16 → 20px | 1.6 | sans | **介紹一個區塊的短段落**：區塊副標、說明區的內文、Hero 副標；選單的分類連結；方案頁左右兩欄的六大類別名稱、超支金額 |
| `text-body` | 15 → 17px | 1.6 | sans | **一般內文**：表單說明、長段落 |
| `text-small` | 13 → 15px | 1.5 | sans | **補充資訊**：卡片上的「55% of your budget」、footer 連結、版權宣告 |
| `text-label` | 11 → 13px | 1.4 | sans | **全大寫標籤**：按鈕、導覽列、卡片的分類名稱、footer 的欄位標題 |
| `text-input` | 固定 16px | 1.5 | 跟欄位 | **表單欄位裡打的字或選的值**：預算、城市、人數、預約表單、篩選欄。**固定 16px 不縮放**，因為小於 16px 時，iPhone 點欄位會自動放大整個頁面（2026-11-18 新增） |

### 怎麼挑字級
- 這段文字是**整頁的主角**嗎？→ `display`（一頁只有一個）
- 是**一個區塊的標題**嗎？→ `title`
- 是**工具頁（方案、收藏）裡的小區塊標題**嗎？→ `heading`
- 是**要被逐字閱讀、帶情緒的句子**嗎？→ `statement`
- 是**標題下面那段說明**嗎？→ `lead`
- 是**一般說明文字**嗎？→ `body`
- 是**附帶的小資訊**嗎？→ `small`
- 是**按鈕或全大寫的小標**嗎？→ `label`
- 是**表單欄位裡的字**嗎？→ `input`

### 相鄰兩級的差距
相鄰的兩級之間大約差 1.25～1.5 倍，例如 title 44px 和 statement 34px。差距太小，看起來像排版沒對齊；差距太大，畫面會斷裂。**不要在兩級之間自己發明一個中間值。**

---

## 3. 字重

| 字重 | Class | 用在哪裡 |
|---|---|---|
| Light 300 | `font-light` | **所有襯線標題**（display / title / statement）。細線條讓大字顯得輕盈優雅。疊在影片或照片上的 sans 副標也用 light |
| Regular 400 | 預設，不用寫 | **所有 sans 文字**：內文、標籤、按鈕 |
| Medium 500 | `font-medium` | **只用在兩種地方**：實心主要按鈕的文字（玫瑰木底上，讓 4.7:1 的對比更好讀），以及超支金額這類警示數字（2026-11-18 新增） |
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

## 7. 同一種資訊，同一種樣式

**規則：只要是同一種資訊，不管出現在哪個頁面、哪個元件，字體、字級、字重、大小寫、顏色都要完全一樣。**（2026-11-18 定）

原因：使用者靠樣式辨認資訊。同一個東西長得不一樣，會讓人以為是兩種不同的資訊，造成誤解；反過來，不同的資訊也不要長得一樣。

新增或修改畫面時，先查下表。如果是新的資訊種類，先決定一種樣式、補進表裡，之後都照這個用。

| 資訊 | 樣式 | 出現在 |
|---|---|---|
| 店名 | `font-serif text-body`，梅子色 | 廠商卡片、收藏頁、收藏面板、預約卡片 |
| 廠商牌價 | `text-small text-plum tabular-nums` | 廠商卡片、收藏頁、收藏面板 |
| 城市 | `text-small text-cocoa`，接在價格或時間後面用「 · 」隔開 | 廠商卡片、收藏頁、預約卡片 |
| 六大類別名稱 | `font-sans text-lead` | 方案頁左右兩欄、預覽骨架、收藏頁 |
| 使用者自己的類別預算 | `text-body text-cocoa tabular-nums` | 方案頁右欄、收藏頁 |
| 方案摘要（預算 · 城市 · 人數） | `text-body text-cocoa tabular-nums` | 收藏頁色帶 |
| 預約類型（VENUE VISIT…） | `font-sans text-label tracking-[0.05em] uppercase` | 預約卡片、收藏頁店家底下、預約視窗的選項按鈕 |
| 預約時間 | `text-small text-plum tabular-nums` | 預約卡片、收藏頁店家底下 |
| 超支金額 | `font-sans text-lead font-medium text-terracotta` | 方案頁左欄、手機底部提示 |
| 首頁分類卡片的標題 | `font-serif text-lead font-light` | 首頁橫向捲動的六張分類卡片（品牌展示，不是工具頁的類別名稱） |
| 首頁分類卡片的描述 | `font-sans text-small text-cocoa` | 首頁分類卡片標題下方那一句 |
| 小面板裡的分組標籤（類別名稱當分組用） | `font-sans text-small text-cocoa` | 右上角收藏面板 |

**分組標籤不是「六大類別名稱」那一種資訊。** 它的任務是把面板裡的店家分組，不是內容的標題，而且面板很窄，所以用小字。只要是當分組用的標籤，都照這一列；當標題或內容用的類別名稱，照「六大類別名稱」那一列。（2026-11-18 定）

---

## 8. 例外

- **Logo** 用 `font-display`，大小各自設定（header 22～32px、footer 26～36px），不套用字級。
- **Intro 開場的 logo** 也是例外，屬於品牌展示。

---

## 9. 目前的套用狀態

| 範圍 | 狀態 |
|---|---|
| 首頁所有區塊（Hero、Story、分類卡片、說明區、結尾） | ✅ 已套用 |
| Header、選單、Footer | ✅ 已套用（logo 除外） |
| 規劃頁（PlanPage、PlanForm） | ⏳ 尚未套用 |
| 結果頁（ResultsPage、BudgetAllocation、VendorCarousel） | ⏳ 尚未套用 |
| 廠商頁（VendorsPage、VendorCard）、404 頁 | ⏳ 尚未套用 |

尚未套用的頁面，還是用 `text-[clamp(...)]` 這類個別寫死的數字，之後要逐一換成上面的 class。
