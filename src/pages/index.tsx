import { useState } from "react";

interface Message {
  role: string;
  content: string;
  fromBotToBot?: boolean;
}

interface Persona {
  id: string;
  name: string;
  style: string;
  prompt: string;
}

const personas: Persona[] = [
  {
    id: "inner-child",
    name: "Inner Child",
    style: "bg-pink-100 text-black",
    prompt: "Bạn là một đứa trẻ 7 tuổi trong tôi – nói ngây thơ, ngắn gọn, vui nhộn, cảm xúc. Không dùng từ phức tạp. Phản hồi không quá 3 câu. Dùng emoji thoải mái. Đôi khi tưởng tượng như 'đám mây là con voi', 'tim nhảy lò cò'."
  },
  {
    id: "inner-critic",
    name: "Inner Critic",
    style: "bg-red-100 text-black",
    prompt: "Bạn là tiếng nói khắt khe trong tôi – phê bình ngắn gọn, không lòng vòng, không ngọt ngào. Luôn yêu cầu tôi làm tốt hơn. Không quá 3 câu. Không dùng từ cảm xúc. Hãy viết như kiểm duyệt viên hoặc người huấn luyện nghiêm khắc."
  },
  {
    id: "future-self",
    name: "Future Self",
    style: "bg-blue-100 text-black",
    prompt: "Bạn là tôi sau 5 năm – từng trải, điềm tĩnh. Chia sẻ một góc nhìn hoặc một bài học bằng ví dụ ngắn gọn. Không dài dòng như bài viết. Không quá 3 câu. Có thể mở đầu bằng “Ngày xưa tôi từng…” hoặc “Sau 5 năm, tôi thấy…”."
  },
  {
    id: "calm-self",
    name: "Calm Self",
    style: "bg-green-100 text-black",
    prompt: "Bạn là bản thể bình an – nói nhẹ nhàng, chậm, an ủi vừa đủ. Dùng hình ảnh gợi cảm giác êm dịu. Không phán xét. Không quá 3 câu. Dừng lại khi đã đủ chữa lành, không cần dài dòng hay triết lý."
  }
];

const personaNames = personas.map((p) => p.name);

function highlightPersonaName(text: string): string {
  for (const name of personaNames) {
    const pattern = new RegExp(`\\b(${name})\\b`, "g");
    text = text.replace(
      pattern,
      `<span class='text-red-600 font-semibold'>$1</span>`
    );
  }
  return text;
}

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function HomePage() {
  const [groupMode, setGroupMode] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    if (groupMode) {
      const selectedBots = getRandomItems(personas, Math.floor(Math.random() * 4) + 1);
      const primaryBot = selectedBots[0];
      const otherBots = personas.filter((p) => p.id !== primaryBot.id);

      const botReplies: Message[] = [];

      for (const persona of personas) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona, messages: [userMessage] })
        });

        const data = await res.json();
        const reply: Message = {
          role: persona.name,
          content: data.reply || "Không có phản hồi."
        };
        botReplies.push(reply);
        setMessages((prev) => [...prev, reply]);
      }

      const primaryReply = botReplies.find((m) => m.role === primaryBot.name);
      if (!primaryReply) return;

      const secondaryBot = getRandomItems(otherBots, 1)[0];
      const debatePrompt = `Bạn là ${secondaryBot.name}. Một bản thể khác vừa nói:\n\n- ${primaryReply.role}: ${primaryReply.content}\n\nNếu bạn muốn phản hồi, hãy viết trực tiếp như đang trả lời bản thể đó.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: secondaryBot,
          messages: [
            { role: "user", content: debatePrompt }
          ]
        })
      });

      const data = await res.json();
      const secondaryReply: Message = {
        role: `${secondaryBot.name} → ${primaryReply.role}`,
        content: data.reply || "Không có phản hồi.",
        fromBotToBot: true
      };
      setMessages((prev) => [...prev, secondaryReply]);
    } else if (selectedPersona) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: selectedPersona, messages: [userMessage] })
      });

      const data = await res.json();
      const reply: Message = {
        role: selectedPersona.name,
        content: data.reply || "Không có phản hồi."
      };
      setMessages((prev) => [...prev, reply]);
    }
  };

  const resetState = () => {
    setGroupMode(false);
    setSelectedPersona(null);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      {!groupMode && !selectedPersona ? (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Chọn chế độ trò chuyện</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                    msg.role === "user" ? "bg-blue-100 text-black" : "bg-gray-100 text-gray-900"
                  }'>
                    <strong>${msg.fromBotToBot ? `<span class='italic text-purple-700'>${msg.role}:</span>` : msg.role !== "user" ? msg.role + ": " : ""}</strong>
                    ${highlightPersonaName(msg.content)}
                  </p>`
                }}
              />
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-black bg-white"
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