---
name: cocoindex-hybrid
description: Chạy CocoIndex để index codebase vào vector DB.
             Dùng khi user muốn semantic search, RAG-powered planning,
             hoặc incremental code understanding trong Haki workflow.
---

# /haki:index

Index toàn bộ codebase và SKILL.md của project vào PostgreSQL vector DB
bằng CocoIndex. Chạy thủ công khi user cần.

## Khi nào dùng

- User gõ `/haki:index`
- User nói "index codebase này"
- User muốn enable semantic search cho `/haki:plan`

## Khi nào KHÔNG dùng

- CocoIndex chưa được cài → dùng `/haki:map-codebase` thay thế
- Chỉ muốn hiểu 1 file cụ thể → đọc trực tiếp
- Project có ít code, `/haki:map-codebase` đủ nhanh

## Steps

### 1. Detect environment

Chạy detect script để check CocoIndex availability:

```bash
node .haki/cocoindex/cli/index.js --check
```

Kết quả:
- `ready: true` → proceed to step 2
- `ready: false` → show warning + setup instructions, stop

### 2. Ensure Postgres is running

```bash
cd .haki/cocoindex && docker compose up -d
```

Nếu `docker compose up` lỗi → báo user và suggest:
```bash
node .haki/cocoindex/cli/index.js --setup
```

### 3. Run indexing

```bash
node .haki/cocoindex/cli/index.js
```

**Expected behavior:**
- Scan tất cả source files trong project
- Scan `.agent/skills/SKILL.md`
- Chunk → embed → export to PostgreSQL
- Output: số chunks indexed, thời gian, model used

### 4. Verify

Sau khi done, báo user:
```
✅ Index hoàn tất!
📊 Chunks indexed: [N]
📁 Files scanned: [M]
⏱️  Duration: [X]s
💾 Vector DB: PostgreSQL (pgvector)
🧠 Embedding: [model-name]

Tiếp theo bạn có thể:
  /haki:ask "hỏi gì về codebase"
  /haki:plan <task> — giờ plan sẽ dùng vector context
```

## Error Handling

| Error | Action |
|---|---|
| `cocoindex: command not found` | Báo + setup instructions |
| `Postgres connection refused` | `docker compose up -d` |
| `embedding model not found` | Re-run với `--model <name>` |
| `Permission denied` | User cần kiểm tra quyền `.haki/cocoindex/` |

## Config

Config được lưu tại `.haki/cocoindex/config.json`:
```json
{
  "embedding_model": "sentence-transformers/nomic-embed-text-v1.5",
  "chunk_size": 1000,
  "excluded_patterns": ["node_modules", ".git", ...],
  "last_indexed": null,
  "pg_port": 54320
}
```
