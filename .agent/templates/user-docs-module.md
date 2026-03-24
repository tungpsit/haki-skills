# {{MODULE_NAME}}

## Tổng quan

{{Mô tả ngắn: module này làm gì, ai sử dụng, khi nào sử dụng, truy cập từ đâu}}

## Luồng thao tác

```mermaid
flowchart TD
    A[{{STEP_1}}] --> B[{{STEP_2}}]
    B --> C{{{CONDITION}}}
    C -->|Có| D[{{STEP_3A}}]
    C -->|Không| E[{{STEP_3B}}]
    D --> F[{{END}}]
    E --> F
```

## Hướng dẫn từng bước

### Bước 1: {{STEP_NAME}}

{{Mô tả thao tác. Dùng ①②③ để chỉ vùng trên screenshot.}}

![Bước 1](assets/{{MODULE_SLUG}}-01-{{ACTION}}.png)

### Bước 2: {{STEP_NAME}}

{{Mô tả thao tác.}}

![Bước 2](assets/{{MODULE_SLUG}}-02-{{ACTION}}.png)

### Bước 3: {{STEP_NAME}}

{{Mô tả thao tác.}}

![Bước 3](assets/{{MODULE_SLUG}}-03-{{ACTION}}.png)

## Mô tả các trường

| Trường      | Bắt buộc | Mô tả           |
| ----------- | -------- | --------------- |
| {{FIELD_1}} | ✅       | {{DESCRIPTION}} |
| {{FIELD_2}} | ❌       | {{DESCRIPTION}} |
| {{FIELD_3}} | ✅       | {{DESCRIPTION}} |

## Câu hỏi thường gặp

**Q: {{QUESTION_1}}**

A: {{ANSWER_1}}

**Q: {{QUESTION_2}}**

A: {{ANSWER_2}}

**Q: {{QUESTION_3}}**

A: {{ANSWER_3}}
