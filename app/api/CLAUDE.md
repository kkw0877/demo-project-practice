# API Routes

## Structure

```
app/api/
└── analyze/
    └── route.ts   # POST /api/analyze
```

## POST /api/analyze

**Request**: `{ messages: { date, user, message }[] }`

**Process**:
1. Filters out media-only messages where `message` is one of: `이모티콘`, `사진`, `동영상`, `파일`
2. Formats remaining messages as `[date] user: message` lines
3. Calls `claude-sonnet-4-6` via `@anthropic-ai/sdk` with a Korean system prompt

**Response**: `{ summary: string, topics: string[], actionItems: { task, priority, context }[] }`
- `priority`: `"high"` | `"medium"` | `"low"`
- On JSON parse failure: `{ error: string, raw: string }` with HTTP 500

## Environment

`ANTHROPIC_API_KEY` must be set (`.env.local` in development).
