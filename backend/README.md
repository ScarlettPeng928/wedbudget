# WedBudget backend

規則和 API 格式見 [SPEC.md](SPEC.md)。以下指令都在 `backend/` 資料夾執行。

## 每天開始寫程式

1. 打開 Docker Desktop（SQL Server 會自動啟動）
2. 啟動 API：

   ```bash
   .venv/bin/uvicorn app.main:app --reload
   ```

3. 瀏覽器打開 <http://localhost:8000/docs>，可以直接試每一支 API

`--reload`：存檔後自動重啟，不用手動關掉再開。按 `Ctrl + C` 停止。

## 第一次在新電腦設定

```bash
cp .env.example .env              # 再打開 .env，填入自己的密碼
docker compose up -d              # 啟動 SQL Server
python3.14 -m venv .venv          # 建立虛擬環境
.venv/bin/pip install -r requirements.txt
docker exec wedbudget-db bash -c '/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "CREATE DATABASE WedBudget"'
.venv/bin/alembic upgrade head    # 建立資料表
.venv/bin/python seed.py          # 匯入初始資料
```

## 常用指令

| 要做什麼 | 指令 |
| --- | --- |
| 跑測試 | `.venv/bin/pytest` |
| 重新匯入初始資料（可以重複執行） | `.venv/bin/python seed.py` |
| 改了 `app/models.py` 之後，產生資料表變更腳本 | `.venv/bin/alembic revision --autogenerate -m "說明"` |
| 套用資料表變更 | `.venv/bin/alembic upgrade head` |
| 停止 SQL Server | `docker compose down`（資料會保留） |

## 檔案

| 檔案 | 內容 |
| --- | --- |
| `app/main.py` | API 路徑和錯誤格式 |
| `app/rules.py` | 計算規則：分配、桌數、估算總價 |
| `app/models.py` | 三張資料表 |
| `app/schemas.py` | API 收發的 JSON 格式 |
| `app/db.py`、`app/config.py` | 資料庫連線、讀取 `.env` |
| `alembic/versions/` | 資料表的變更紀錄 |
| `seed.py` | 初始資料 |
| `tests/` | 計算規則的測試 |
