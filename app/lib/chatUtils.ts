export interface Message {
  date: string;
  user: string;
  message: string;
}

const MEDIA_TYPES = ["이모티콘", "사진", "동영상", "파일"];

export function filterMessages(messages: Message[]): Message[] {
  return messages.filter(
    (m) => m.message && !MEDIA_TYPES.includes(m.message.trim())
  );
}

export function formatChatText(messages: Message[]): string {
  return messages.map((m) => `[${m.date}] ${m.user}: ${m.message}`).join("\n");
}

export function extractJsonFromText(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}
