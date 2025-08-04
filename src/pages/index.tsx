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

const personaNames = personas.map(p => p.name);

function highlightPersonaName(text) {
  for (const name of personaNames) {
    const pattern = new RegExp(`(${name}:)`, 'g');
    if (pattern.test(text)) {
      return text.replace(pattern, `<span class='text-red-600 font-semibold'>$1</span>`);
    }
  }
  return text;
}

export default function HomePage() {
  const [groupMode, setGroupMode] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    if (groupMode) {
      let botReplies = [];
      for (const persona of personas) {
        const filteredReplies = botReplies.map((m) => ({
          role: "assistant",
          content: `${m.role}: ${m.content}`
        }));

        const payloadMessages = [
          { role: "user", content: input },
          ...filteredReplies.filter(m => m.role !== persona.name)
        ];

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona, messages: payloadMessages })
        });

        const data = await res.json();
        const reply = { role: persona.name, content: data.reply || "Không có phản hồi." };
        botReplies.push(reply);
        setMessages((prev) => [...prev, reply]);
      }
    } else if (selectedPersona) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: selectedPersona, messages: newMessages })
      });
      const data = await res.json();
      setMessages([...newMessages, { role: selectedPersona.name, content: data.reply || "Không có phản hồi." }]);
    }
  };

  const resetState = () => {
    setGroupMode(false);
    setSelectedPersona(null);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {!groupMode && !selectedPersona ? (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Chọn chế độ trò chuyện</h1>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className={`rounded-2xl p-6 cursor-pointer shadow ${persona.style}`}
                onClick={() => setSelectedPersona(persona)}
              >
                <h2 className="text-xl font-semibold">{persona.name}</h2>
                <p className="text-sm mt-2">Trò chuyện 1:1 với bản ngã này</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700"
              onClick={() => setGroupMode(true)}
            >
              Trò chuyện với cả nhóm bản ngã
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <button
              className="text-sm text-blue-600 underline mb-2"
              onClick={resetState}
            >
              ← Quay lại chọn chế độ
            </button>
            <h2 className="text-xl font-bold">
              Bạn đang trò chuyện với: {groupMode ? "Toàn bộ bản ngã" : selectedPersona?.name}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow p-4 space-y-4 h-[500px] overflow-y-scroll">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-${msg.role === "user" ? "right" : "left"}`}
                dangerouslySetInnerHTML={{
                  __html: `<p class='inline-block px-4 py-2 rounded-xl ${
                    msg.role === "user" ? "bg-blue-100" : "bg-gray-200"
                  }'><strong>${msg.role !== "user" ? msg.role + ": " : ""}</strong>${highlightPersonaName(
                    msg.content
                  )}</p>`
                }}
              />
            ))}
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