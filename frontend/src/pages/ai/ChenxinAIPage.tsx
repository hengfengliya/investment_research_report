import { useMemo, useState } from "react";
import { aiModes } from "@data/aiModes";

interface Message {
  role: "user" | "assistant";
  content: string;
  mode: string;
}

/**
 * 辰星 AI 页面：模式化提示 + 简易对话体验
 */
const ChenxinAIPage = () => {
  const [activeMode, setActiveMode] = useState(aiModes[0].id);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const currentMode = useMemo(() => aiModes.find((mode) => mode.id === activeMode)!, [activeMode]);

  const pushMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { role, content, mode: activeMode }]);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    pushMessage("user", text);
    setInputValue("");

    const response = `【${currentMode.label}】已接收：${text}\n下一个动作：输出结构化要点（驱动因素 / 风险 / 观察指标）。`;
    pushMessage("assistant", response);
  };

  const handleSuggestion = (sample: string) => {
    setInputValue(sample);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border-default bg-white p-8 shadow-sm">
        <p className="text-xs tracking-[0.3em] text-text-secondary">CHENXIN AI</p>
        <h2 className="mt-4 text-3xl font-medium">结构化投研助手</h2>
        <p className="mt-3 max-w-3xl text-sm text-text-secondary">
          保留 voidmatter 中的「有物 AI」交互逻辑，但全部切换为浅色极简风格。模式切换、提示语和输出节奏已经就位，后续可以直接接入真实接口。
        </p>
      </div>

      <div className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
        <p className="text-xs text-text-secondary">选择模式</p>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          {aiModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                activeMode === mode.id
                  ? "border-black bg-black text-white"
                  : "border-border-default text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setActiveMode(mode.id)}
            >
              <p className="font-semibold">{mode.label}</p>
              <p className="mt-2 text-xs">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
        <p className="text-xs text-text-secondary">输入问题</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row">
          <textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={currentMode.placeholder}
            className="h-28 flex-1 rounded-2xl border border-border-default px-4 py-3 text-sm focus:border-black focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            className="rounded-2xl bg-black px-6 py-3 text-sm text-white"
          >
            发送
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-secondary">
          {currentMode.samples.map((sample) => (
            <button
              key={sample}
              type="button"
              className="rounded-full border border-border-default px-3 py-1"
              onClick={() => handleSuggestion(sample)}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
        <p className="text-xs text-text-secondary">对话记录</p>
        {messages.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">输入问题即可开始一次新的投研会话。</p>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`rounded-2xl border px-4 py-3 ${
                  message.role === "user"
                    ? "border-black bg-black text-white"
                    : "border-border-default bg-bg-secondary text-text-secondary"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.2em]">
                  {message.role === "user" ? "RESEARCHER" : "CHENXIN AI"} · {message.mode}
                </p>
                <p className="mt-2 whitespace-pre-line">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ChenxinAIPage;
