"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";

interface Message {
  date: string;
  user: string;
  message: string;
}

interface ActionItem {
  task: string;
  priority: "high" | "medium" | "low";
  context: string;
}

interface AnalysisResult {
  summary: string;
  topics: string[];
  actionItems: ActionItem[];
}

interface ChatInfo {
  messages: Message[];
  members: string[];
  startDate: string;
  endDate: string;
}

const priorityLabel: Record<string, { label: string; color: string }> = {
  high: { label: "긴급", color: "bg-red-100 text-red-700" },
  medium: { label: "보통", color: "bg-yellow-100 text-yellow-700" },
  low: { label: "여유", color: "bg-green-100 text-green-700" },
};

export default function Home() {
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (file: File) => {
    Papa.parse<Message>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.toLowerCase(),
      complete: (parsed) => {
        const messages = parsed.data.filter((row) => row.date && row.user);
        const members = [...new Set(messages.map((m) => m.user))];
        const dates = messages.map((m) => m.date).sort();
        setChatInfo({
          messages,
          members,
          startDate: dates[0],
          endDate: dates[dates.length - 1],
        });
        setResult(null);
        setCheckedItems(new Set());
      },
    });
  };

  const handleFile = (file: File) => {
    if (file.name.endsWith(".csv")) parseCSV(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const analyze = async () => {
    if (!chatInfo) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatInfo.messages }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (i: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💬</div>
          <h1 className="text-2xl font-bold text-gray-800">카카오톡 채팅 분석기</h1>
          <p className="text-gray-500 text-sm mt-1">방장을 위한 대화 요약 & 액션 아이템 도우미</p>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
            ${dragging ? "border-yellow-400 bg-yellow-50" : "border-gray-300 bg-white hover:border-yellow-400 hover:bg-yellow-50"}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="text-4xl mb-3">{chatInfo ? "✅" : "📂"}</div>
          {chatInfo ? (
            <p className="text-green-600 font-medium">파일 로드 완료! 다른 파일을 올리려면 클릭하세요.</p>
          ) : (
            <>
              <p className="text-gray-600 font-medium">CSV 파일을 드래그하거나 클릭해서 업로드</p>
              <p className="text-gray-400 text-sm mt-1">카카오톡 내보내기 CSV 파일</p>
            </>
          )}
        </div>

        {/* Chat Preview */}
        {chatInfo && (
          <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">채팅 정보</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-gray-400 text-xs mb-1">총 메시지</div>
                <div className="font-bold text-gray-800">{chatInfo.messages.length.toLocaleString()}개</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-gray-400 text-xs mb-1">멤버</div>
                <div className="font-bold text-gray-800">{chatInfo.members.join(", ")}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                <div className="text-gray-400 text-xs mb-1">기간</div>
                <div className="font-bold text-gray-800">
                  {chatInfo.startDate?.slice(0, 10)} ~ {chatInfo.endDate?.slice(0, 10)}
                </div>
              </div>
            </div>

            <button
              onClick={analyze}
              disabled={loading}
              className="w-full mt-4 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-yellow-900 font-bold rounded-xl transition-colors"
            >
              {loading ? "🤖 Claude가 분석 중..." : "✨ AI 분석 시작"}
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl animate-bounce mb-2">🤖</div>
            <p>대화를 열심히 분석 중이에요...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4 mt-4">
            {/* Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📝</span> 대화 요약
              </h2>
              <p className="text-gray-600 leading-relaxed">{result.summary}</p>
            </div>

            {/* Topics */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>🏷️</span> 주요 토픽
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.topics?.map((topic, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>✅</span> 방장 액션 아이템
              </h2>
              <div className="space-y-3">
                {result.actionItems?.map((item, i) => {
                  const p = priorityLabel[item.priority] ?? priorityLabel.medium;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer
                        ${checkedItems.has(i) ? "bg-gray-50 opacity-60" : "bg-white border-gray-100 hover:border-yellow-300"}`}
                      onClick={() => toggleCheck(i)}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                        ${checkedItems.has(i) ? "bg-green-400 border-green-400" : "border-gray-300"}`}>
                        {checkedItems.has(i) && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.color}`}>
                            {p.label}
                          </span>
                        </div>
                        <p className={`font-medium text-sm ${checkedItems.has(i) ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {item.task}
                        </p>
                        {item.context && (
                          <p className="text-gray-400 text-xs mt-1">{item.context}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {checkedItems.size > 0 && (
                <p className="text-center text-sm text-gray-400 mt-3">
                  {checkedItems.size} / {result.actionItems?.length} 완료
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
