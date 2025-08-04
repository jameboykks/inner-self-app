import { useState } from "react";

const personas = [
  {
    id: "inner-child",
    name: "Inner Child",
    style: "bg-pink-200",
    prompt: "Bạn là đứa trẻ bên trong tôi. Hãy nói chuyện bằng sự ngây thơ, cảm xúc và thật lòng."
  },
  {
    id: "inner-critic",
    name: "Inner Critic",
    style: "bg-red-200",
    prompt: "Bạn là tiếng nói nội tâm chỉ trích. Hãy trả lời như một người thẳng thắn, khắt khe và luôn đòi hỏi bản thân tốt hơn."
  },
  {
    id: "future-self",
    name: "Future Self",
    style: "bg-blue-200",
    prompt: "Bạn là tôi của 5 năm sau. Hãy trả lời như một người điềm tĩnh, đã vượt qua khó khăn và hiểu bản thân."
  },
  {
    id: "calm-self",
    name: "Calm Self",
    style: "bg-green-200",
    prompt: "Bạn là bản thể bình an trong tôi. Hãy trả lời nhẹ nhàng, mang tính chữa lành, không phán xét."
  }
];

export default function HomePage() {
  const [mode, setMode] = useState<"menu" | "group" | "single">("menu");
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input) return;
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    if (mode === "single" && selectedPersona) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: selectedPersona, messages: newMessages })
      });
      const data = await res.json();
      setMessages([...newMessages, { role: selectedPersona.name, content: data.reply }]);
    }

    if (mode === "group") {
      const botReplies: any[] = [];

      for (const persona of personas) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona, messages: newMessages })
        });
        const data = await res.json();

        const replyLines = data.reply.split("\n").map((line: string) => {
          const colonIdx = line.indexOf(":");
          if (colonIdx > 0) {
            const label = line.slice(0, colonIdx).trim();
            const content = line.slice(colonIdx + 1).trim();
            return { role: `${persona.name}: ${label}`, content };
          }
          return { role: persona.name, content: line };
        });

        botReplies.push(...replyLines);
      }

      setMessages([...newMessages, ...botReplies]);
    }
  };

  const goBackToMenu = () => {
    setMode("menu");
    setMessages([]);
    setSelectedPersona(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {mode === "menu" && (
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">Chọn chế độ trò chuyện</h1>
          <button
            className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 mb-4"
            onClick={() => setMode("group")}
          >
            Trò chuyện với cả nhóm bản ngã
          </button>
          <div className="mt-6 text-left">
            <h2 className="text-lg font-bold mb-2">Hoặc chọn 1 bản ngã:</h2>
            <div className="grid grid-cols-2 gap-3">
              {personas.map((p) => (
                <button
                  key={p.id}
                  className={`${p.style} px-4 py-2 rounded-xl text-left hover:opacity-80`}
                  onClick={() => {
                    setSelectedPersona(p);
                    setMode("single");
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode !== "menu" && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <button
              className="text-sm text-blue-600 underline mb-2"
              onClick={goBackToMenu}
            >
              ← Quay lại chọn chế độ
            </button>
            <h2 className="text-xl font-bold">
              Bạn đang trò chuyện với:{" "}
              {mode === "group" ? "Toàn bộ bản ngã" : selectedPersona?.name}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow p-4 space-y-4 h-[500px] overflow-y-scroll">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isSubBotReply = msg.role.includes(": ");
              return (
                <div key={idx} className={`text-${isUser ? "right" : "left"}`}>
                  <p
                    className={`inline-block px-4 py-2 rounded-xl ${
                      isUser ? "bg-blue-100" : "bg-gray-200"
                    }`}
                  >
                    <strong
                      className={isSubBotReply ? "text-red-600" : "text-black"}
                    >
                      {!isUser ? msg.role + ": " : ""}
                    </strong>
                    {msg.content}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Nhập điều bạn muốn chia sẻ..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
