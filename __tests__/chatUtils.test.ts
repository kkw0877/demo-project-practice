import { describe, it, expect } from "vitest";
import { filterMessages, formatChatText, extractJsonFromText } from "../app/lib/chatUtils";

describe("filterMessages", () => {
  it("일반 텍스트 메시지를 통과시킨다", () => {
    const messages = [{ date: "2024-01-01", user: "홍길동", message: "안녕하세요" }];
    expect(filterMessages(messages)).toHaveLength(1);
  });

  it("이모티콘 메시지를 제거한다", () => {
    const messages = [{ date: "2024-01-01", user: "홍길동", message: "이모티콘" }];
    expect(filterMessages(messages)).toHaveLength(0);
  });

  it("사진, 동영상, 파일 메시지를 제거한다", () => {
    const messages = [
      { date: "2024-01-01", user: "A", message: "사진" },
      { date: "2024-01-01", user: "B", message: "동영상" },
      { date: "2024-01-01", user: "C", message: "파일" },
    ];
    expect(filterMessages(messages)).toHaveLength(0);
  });

  it("앞뒤 공백이 있는 미디어 키워드를 제거한다", () => {
    const messages = [{ date: "2024-01-01", user: "홍길동", message: "  이모티콘  " }];
    expect(filterMessages(messages)).toHaveLength(0);
  });

  it("빈 문자열 메시지를 제거한다", () => {
    const messages = [{ date: "2024-01-01", user: "홍길동", message: "" }];
    expect(filterMessages(messages)).toHaveLength(0);
  });

  it("일반 메시지와 미디어 메시지가 섞여 있을 때 일반 메시지만 남긴다", () => {
    const messages = [
      { date: "2024-01-01", user: "A", message: "안녕" },
      { date: "2024-01-01", user: "B", message: "이모티콘" },
      { date: "2024-01-01", user: "C", message: "잘 지내?" },
    ];
    const result = filterMessages(messages);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.message)).toEqual(["안녕", "잘 지내?"]);
  });
});

describe("formatChatText", () => {
  it("단일 메시지를 [date] user: message 형식으로 포맷한다", () => {
    const messages = [{ date: "2024-01-01", user: "홍길동", message: "안녕하세요" }];
    expect(formatChatText(messages)).toBe("[2024-01-01] 홍길동: 안녕하세요");
  });

  it("여러 메시지를 줄바꿈으로 연결한다", () => {
    const messages = [
      { date: "2024-01-01", user: "A", message: "첫 번째" },
      { date: "2024-01-02", user: "B", message: "두 번째" },
    ];
    expect(formatChatText(messages)).toBe(
      "[2024-01-01] A: 첫 번째\n[2024-01-02] B: 두 번째"
    );
  });

  it("빈 배열에 대해 빈 문자열을 반환한다", () => {
    expect(formatChatText([])).toBe("");
  });
});

describe("extractJsonFromText", () => {
  it("순수 JSON 문자열을 파싱한다", () => {
    const text = '{"summary": "요약", "topics": [], "actionItems": []}';
    const result = extractJsonFromText(text) as Record<string, unknown>;
    expect(result.summary).toBe("요약");
  });

  it("앞뒤 텍스트가 있는 경우 JSON 객체를 추출한다", () => {
    const text = '다음은 결과입니다: {"summary": "요약"} 감사합니다.';
    const result = extractJsonFromText(text) as Record<string, unknown>;
    expect(result.summary).toBe("요약");
  });

  it("JSON이 없는 텍스트에서 예외를 던진다", () => {
    expect(() => extractJsonFromText("이건 JSON이 아닙니다")).toThrow();
  });

  it("중첩 객체를 포함한 JSON을 올바르게 파싱한다", () => {
    const text = '{"actionItems": [{"task": "할 일", "priority": "high"}]}';
    const result = extractJsonFromText(text) as Record<string, unknown[]>;
    expect(result.actionItems).toHaveLength(1);
  });
});
