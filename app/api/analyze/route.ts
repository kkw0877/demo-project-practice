import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { filterMessages, formatChatText, extractJsonFromText, Message } from "@/app/lib/chatUtils";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const filtered = filterMessages(messages as Message[]);
  const chatText = formatChatText(filtered);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `당신은 카카오톡 그룹채팅방 방장의 어시스턴트입니다. 대화를 분석해서 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "summary": "대화 전체 흐름 요약 (2-3문장, 한국어)",
  "topics": ["주요 토픽 1", "토픽 2", "토픽 3"],
  "actionItems": [
    { "task": "방장이 해야 할 일", "priority": "high", "context": "배경 설명" }
  ]
}
priority는 high, medium, low 중 하나입니다.`,
    messages: [
      {
        role: "user",
        content: `다음 카카오톡 대화를 분석해주세요:\n\n${chatText}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const result = extractJsonFromText(text);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "분석 결과 파싱 실패", raw: text }, { status: 500 });
  }
}
