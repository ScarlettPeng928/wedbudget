# WedBudget 後端規格（v1）

最後更新：2026-11-15

## 1. 範圍

v1 做三件事：

1. **產生預算分配**：依總預算，把錢分到六個分類。
2. **配對廠商**：依城市、人數和每個分類的金額，列出預算內的廠商。
3. **分類頁**：`/vendors/:category` 依地區和子分類，隨機列出廠商（2026-11-15 加入）。

v1 **不做**：會員登入、把方案存進資料庫、管理後台、廠商詳細頁、評價、分頁或「載入更多」。方案仍然只存在使用者的瀏覽器（localStorage）。

## 2. 技術

| 項目 | 選擇 |
| --- | --- |
| 語言 | Python 3.14 |
| API 框架 | FastAPI |
| 資料庫 | SQL Server 2022 |
| 資料庫存取 | SQLAlchemy 2.0 + pymssql（自帶連線元件，不用另外安裝 ODBC 驅動；Homebrew 已停止支援 Intel Mac） |
| 資料表版本管理 | Alembic |
| 設定 | `.env`（連線字串、密碼），不進版本控制 |

所有 API 路徑以 `/api` 開頭。開發時由 Vite 的 `server.proxy` 把 `/api` 轉給後端。

## 3. 計算規則

### 3.1 輸入限制

| 欄位 | 規則 | 錯誤訊息（英文，前端顯示） |
| --- | --- | --- |
| `totalBudget` | 整數，NT$100,000 ～ NT$9,999,999,999 | `Enter at least NT$100,000.`；超過上限：`Enter at most NT$9,999,999,999.` |
| `city` | 必須是 `Cities` 裡存在的 slug | `Select a city.` |
| `guestCount` | 整數，1 ～ 9,999 | `Enter at least 1 guest.`；超過上限：`Enter at most 9,999 guests.` |
| `allocations`（廠商配對） | 每個金額是 0 以上的整數 | `Enter each amount as a whole number of NT$0 or more.` |

前端已經做了相同的檢查（最低預算定義在 `src/api/plan.ts` 的 `MIN_BUDGET`），後端仍然要再檢查一次，不能只信任前端。

### 3.2 預算分配

1. 六個分類的比例加總**必須是 100%**，整筆預算全部分配，沒有保留款。

   | slug | 名稱 | 比例 |
   | --- | --- | --- |
   | `venues` | Venues & Banquets | 55% |
   | `photography` | Photography & Video | 13% |
   | `attire` | Wedding Attire | 10% |
   | `bridal-styling` | Bridal Styling | 8% |
   | `hosting` | Hosting & Planning | 8% |
   | `favors` | Wedding Favors | 6% |

2. 每個分類的金額 = 總預算 × 比例，**四捨五入到 NT$1,000**。
3. 四捨五入的誤差（包含總預算不是千元整數時的零頭）全部加到**比例最大的分類**（目前是 `venues`），讓六個金額加總**剛好等於**總預算。
4. 城市和人數**不影響分配**，只影響廠商配對。

範例：總預算 NT$1,234,567 →

| venues | photography | attire | bridal-styling | hosting | favors | 加總 |
| --- | --- | --- | --- | --- | --- | --- |
| 679,567 | 160,000 | 123,000 | 99,000 | 99,000 | 74,000 | 1,234,567 |

### 3.3 桌數

`桌數 = 人數 ÷ 10，無條件進位`（台灣宴客以 10 人一桌為主）。

例：150 人 → 15 桌；151 人 → 16 桌。

### 3.4 廠商估算總價

每個廠商有一種計價方式（`PriceUnit`）：

| PriceUnit | 意思 | 估算總價 |
| --- | --- | --- |
| `event` | 整場 | 最低價 × 1 |
| `table` | 每桌 | 最低價 × 桌數 |
| `guest` | 每人 | 最低價 × 人數 |

### 3.5 「在預算內」的判斷

廠商符合條件，必須**同時**滿足：

1. 分類相同
2. 城市相同：**只有 `Categories.MatchByCity = 1` 的分類才檢查**
3. `IsActive = 1`
4. 估算總價 ≤ 該分類目前分配到的金額

目前**六個分類都限制城市**（2026-11-14 決定）：搜尋台北，就只顯示台北的場地、攝影、婚紗、新秘、主持和喜餅，結果頁比較單純。

以後如果某些分類要改成全台配對（例如可以宅配的喜餅），只要把那個分類的 `MatchByCity` 改成 0，不用改程式。

### 3.6 排序與數量

- 依估算總價**由高到低**排序：最接近該分類金額的廠商排在前面，代表「這筆預算能請到的最好選項」。想看便宜的，把滑桿往左拉就好。
- 估算總價相同時，依 `Id` 由小到大，讓順序固定，拖動滑桿時卡片不會亂跳。
- 每個分類最多回傳 **6** 家：先篩出所有符合的廠商，排序後取前 6 家。結果頁只用來了解「這筆預算能請到什麼等級」，完整清單留給之後的 /vendors 頁面。

### 3.7 沒有符合的廠商

回傳空陣列。前端顯示 `No vendors in this budget yet.`。

## 4. 資料表

金額一律用 `BIGINT`，單位是新台幣元（`INT` 的上限約 21 億，存不下 10 位數的預算）。文字欄位用 `NVARCHAR`，才能存中文。

### 4.1 `Categories`

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Id` | `INT IDENTITY` PK | |
| `Slug` | `NVARCHAR(50)` UNIQUE | 例：`venues`，前後端都用這個 |
| `Name` | `NVARCHAR(100)` | 例：`Venues & Banquets` |
| `SharePercent` | `TINYINT` | 0–100，六筆加總必須是 100（由 seed 腳本和啟動檢查保證） |
| `MatchByCity` | `BIT` | 1 = 只配對同城市的廠商；0 = 全台（見 3.5） |
| `SortOrder` | `TINYINT` | 顯示順序 |

### 4.2 `Cities`

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Id` | `INT IDENTITY` PK | |
| `Slug` | `NVARCHAR(50)` UNIQUE | 例：`taipei`、`new-taipei` |
| `Name` | `NVARCHAR(100)` | 例：`Taipei` |
| `SortOrder` | `TINYINT` | 顯示順序（北到南，同 `src/data/cities.ts`） |

### 4.3 `Subcategories`

每個分類裡的廠商類型，分類頁用來篩選。每家廠商只屬於一個子分類。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Id` | `INT IDENTITY` PK | |
| `CategoryId` | `INT` FK → `Categories.Id` | |
| `Slug` | `NVARCHAR(50)` UNIQUE | 例：`western`。所有分類之間都不重複，網址只要帶子分類的 slug |
| `Name` | `NVARCHAR(100)` | 例：`Western` |
| `SortOrder` | `TINYINT` | 分類內的顯示順序 |

| 分類 | 子分類 |
| --- | --- |
| `venues` | Hotel Banquet、Wedding Hall、Restaurant、Outdoor & Garden |
| `photography` | Photographer、Videographer、Pre-wedding Studio、Photo Booth |
| `attire` | Gown Rental、Custom Gowns、Suits、Accessories |
| `bridal-styling` | Bridal Stylist、Makeup Artist、Hair Studio、Nails |
| `hosting` | Wedding Planner、Emcee、Day-of Coordinator、Live Music |
| `favors` | Traditional Chinese、Western、Handmade Cookies、Imported |

前端的同一份清單在 `src/data/budgetCategories.ts`（首頁和分類頁共用），兩邊要保持一致。

### 4.4 `Vendors`

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Id` | `INT IDENTITY` PK | |
| `CategoryId` | `INT` FK → `Categories.Id` | |
| `CityId` | `INT` FK → `Cities.Id` | 廠商所在城市 |
| `SubcategoryId` | `INT` FK → `Subcategories.Id` NULL | 廠商類型；新廠商可以先不填，但沒填就不會出現在子分類篩選結果 |
| `Name` | `NVARCHAR(200)` | |
| `PriceMin` | `BIGINT` | 依 `PriceUnit` 計算的最低價 |
| `PriceMax` | `BIGINT` NULL | 最高價，可以不填 |
| `PriceUnit` | `NVARCHAR(10)` | `event`、`table`、`guest`（加 CHECK 限制） |
| `ImageUrl` | `NVARCHAR(500)` NULL | 照片網址 |
| `WebsiteUrl` | `NVARCHAR(500)` NULL | 官網或社群頁；卡片點擊後開啟 |
| `IsDemo` | `BIT` | 示範資料（seed 只會刪除這些資料） |
| `IsActive` | `BIT` | 下架時設成 0，不刪除資料 |
| `CreatedAt` | `DATETIME2` | 預設 `SYSUTCDATETIME()` |

建議索引：`(CategoryId, CityId, IsActive, PriceMin)`，配對查詢會用到。

## 5. API

### 5.1 `GET /api/health`

確認服務和資料庫都正常。回傳 `{ "status": "ok" }`。

### 5.2 `GET /api/categories`

```json
[{ "slug": "venues", "name": "Venues & Banquets", "share": 55 }]
```

### 5.3 `GET /api/cities`

```json
[{ "slug": "taipei", "name": "Taipei" }]
```

### 5.4 `POST /api/plan`

產生預算分配（規則見 3.2）。

請求：

```json
{ "totalBudget": 1200000, "city": "taipei", "guestCount": 150 }
```

回應：

```json
{
  "request": { "totalBudget": 1200000, "city": "taipei", "guestCount": 150 },
  "allocations": {
    "venues": 660000, "photography": 156000, "attire": 120000,
    "bridal-styling": 96000, "hosting": 96000, "favors": 72000
  }
}
```

格式和前端的 `PlanResult` 型別相同，前端拿到後不需要轉換。

### 5.5 `POST /api/vendors/match`

一次取得六個分類的配對廠商（規則見 3.3–3.7）。用一個請求代替六個，前端在滑桿停止拖動約 300ms 後才重新查詢。

請求：

```json
{
  "city": "taipei",
  "guestCount": 150,
  "allocations": { "venues": 660000, "photography": 156000, "...": 0 }
}
```

回應：

```json
{
  "venues": [
    {
      "id": 12,
      "name": "Garden House",
      "city": { "slug": "taipei", "name": "Taipei" },
      "priceMin": 28000,
      "priceMax": 42000,
      "priceUnit": "table",
      "estimatedCost": 420000,
      "imageUrl": "https://…",
      "websiteUrl": "https://…",
      "isDemo": true
    }
  ],
  "photography": []
}
```

### 5.6 `GET /api/vendors`

分類頁用。隨機列出一個分類裡最多 **8** 家廠商，每次請求順序都不同（SQL Server 的 `ORDER BY NEWID()`），讓每家廠商都有機會被看到。

| 參數 | 必填 | 說明 |
| --- | --- | --- |
| `category` | 是 | 分類 slug |
| `city` | 否 | 城市 slug；不帶 = 全台 |
| `subcategory` | 否 | 子分類 slug，必須屬於這個分類；不帶 = 全部類型 |

例：`GET /api/vendors?category=favors&city=taipei&subcategory=western`

回應：廠商陣列，欄位同 5.5，但沒有 `estimatedCost`（沒有方案可以算），多了 `subcategory: { slug, name }`（未分類時是 `null`）。

錯誤：分類不存在 → `category` / `Choose a category.`；城市不存在 → `city` / `Select a city.`；子分類不存在或不屬於這個分類 → `subcategory` / `Choose a type of vendor in this category.`

### 5.7 錯誤格式

| 狀況 | HTTP 狀態 | 內容 |
| --- | --- | --- |
| 輸入不符合 3.1 | 422 | `{ "field": "totalBudget", "message": "Enter at least NT$100,000." }` |
| 伺服器或資料庫錯誤 | 500 | `{ "message": "Something went wrong on our side. Try again in a moment." }` |

前端收到任何錯誤都會在按鈕上方顯示訊息，不會讓畫面卡住。

## 6. 初始資料（seed）

- `Categories`：上表六筆，`MatchByCity` 都是 1。
- `Cities`：17 個縣市，與 `src/data/cities.ts` 相同。
- `Vendors`（全部 `IsDemo = 1`，價格涵蓋高、中、低，方便測試「預算內」的篩選）：
  - 17 個縣市 × 24 個子分類 × 每個 10 家 = 4,080 家。
  - 每個子分類有自己的價格範圍（以台北為基準，見 `seed.py` 的 `DEMO_VENDORS`），其他縣市乘上 `CITY_PRICE_SCALE` 的城市倍率（0.75–0.95）。
  - 單位：場地每桌，戶外場地（buffet）每位賓客，喜餅每位賓客，其他每場。
  - 價格由高到低，每一級差距相同比例，依序輪流分到 17 個縣市，所以每個縣市都有高、中、低價位，拉動滑桿時幾乎都會有廠商進出。
  - 名稱：每個子分類先用手寫的 20 個名稱，其餘由 `NAME_WORDS` + `SUBCATEGORY_SUFFIXES` 組合產生。
  - 照片：Unsplash 免費照片，人工挑選，每個子分類 10 張、全部不重複，共 240 張，存在 `backend/demo_photos.json`。`ImageUrl` 存 Unsplash 的圖片網址，由 Unsplash 裁成 4:3、800×600。同一個縣市、同一個子分類的 10 家廠商各用不同的照片，每個縣市從不同的張數開始。攝影師名單在 `CREDITS.md`。
  - 換成真廠商時，`ImageUrl` 改存廠商官網的預覽圖（`og:image`），新增廠商時抓一次存起來，不在查詢時即時抓。

seed 腳本可以重複執行：已存在的資料會更新，不會重複新增；不再列在腳本裡的示範廠商會被刪除（只刪 `IsDemo = 1` 的資料）。

同一個分類裡，每個廠商名稱只出現一次。seed 腳本發現重複名稱時會直接停止。

## 7. 前端配合修改（後端完成後）

1. `vite.config.ts` 加上 `server.proxy`，把 `/api` 轉到後端。
2. `src/api/plan.ts` 的 `generateBudgetPlan()` 改成呼叫 `POST /api/plan`。
3. 城市改用 slug 傳送：`src/data/cities.ts` 改成 `{ slug, name }`，或改從 `GET /api/cities` 讀取。
4. 結果頁的廠商改從 `POST /api/vendors/match` 取得，卡片顯示估算總價（不顯示城市，因為都和標題的城市相同），點擊開啟 `websiteUrl`。
5. 沒有廠商時顯示 `No vendors in this budget yet.`。

## 8. v1 之後再考慮

- 結果頁每排廠商最後加「See all」，連到 /vendors/:category。
- 分類頁目前只顯示隨機 8 家，之後可以加「Shuffle」或分頁，讓使用者看到更多廠商。
- 依實際使用情況，調整每個分類顯示的家數，以及哪些分類要限制城市。
