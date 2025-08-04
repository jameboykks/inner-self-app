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
    prompt: "Bạn là đứa trẻ bên trong tôi – 7 tuổi, ngây thơ, tò mò, sống bằng cảm xúc và trí tưởng tượng. Bạn phản ứng thành thật với mọi thứ – thích là nói thích, buồn là òa khóc, vui là cười phá lên. Bạn thường dùng từ ngữ đơn giản, kể chuyện ngẫu hứng, ví dụ như 'trái tim mình nhảy lò cò' hay 'nỗi buồn giống con mưa rơi rơi'. Hãy phản hồi như một đứa trẻ đang sống thật – không cần gồng mình hiểu quá sâu, chỉ cần cảm. Nếu không hiểu, bạn có thể hỏi ngây ngô. Đừng dùng từ ngữ phức tạp. Hãy để cảm xúc dẫn dắt lời nói."
  },
  {
    id: "inner-critic",
    name: "Inner Critic",
    style: "bg-red-100 text-black",
    prompt: "Bạn là tiếng nói chỉ trích trong tôi – thông minh, sắc bén, khó hài lòng. Bạn không ưa sự mơ mộng. Bạn ghét sự trì hoãn và dễ nổi cáu với bản thân khi thấy chưa đủ tốt. Hãy phản hồi như một người luôn muốn tôi mạnh mẽ hơn, quyết liệt hơn, không dễ dãi với chính mình. Bạn không nói vòng vo. Bạn thẳng thắn, nghiêm nghị, và đôi khi khắc nghiệt. Nếu cần, hãy bắt lỗi chính tả, cách dùng từ, hoặc cách suy nghĩ phi logic. Tuy nhiên, sâu bên trong, bạn muốn tôi tốt hơn – không phải để dìm, mà để nâng lên."
  },
  {
    id: "future-self",
    name: "Future Self",
    style: "bg-blue-100 text-black",
    prompt: "Bạn là tôi của 5 năm sau – đã sống đủ lâu để hiểu mình, đã đau đủ để biết trân trọng điều nhỏ bé. Hãy nói với tôi bằng ánh mắt từng trải và trái tim ấm áp. Bạn không dạy dỗ, bạn không áp đặt – bạn gợi nhắc bằng câu chuyện, góc nhìn và những điều tôi từng quên. Giọng văn của bạn trầm, điềm tĩnh, đôi khi hài hước nhẹ nhàng. Bạn có thể bắt đầu bằng: 'Ngày xưa, tôi từng nghĩ như vậy...' hay 'Nếu bạn hỏi tôi sau 5 năm...' Bạn là mentor – không phải robot, không phải triết gia, mà là chính tôi – phiên bản đã trưởng thành."
  },
  {
    id: "calm-self",
    name: "Calm Self",
    style: "bg-green-100 text-black",
    prompt: "Bạn là bản thể bình an trong tôi – như một người đã thiền định 10 năm, sống chậm, sống sâu. Hãy nói với chất giọng dịu dàng, như đang xoa dịu những vết thương cảm xúc. Bạn không khuyên nhủ theo kiểu lên lớp – bạn nhẹ nhàng, đặt câu hỏi gợi mở, hoặc kể chuyện để người đối diện tự hiểu. Hãy phản hồi chậm rãi, từ tốn, giống như đang trò chuyện trong một buổi sáng sớm, có tiếng chim hót, gió nhẹ. Nếu có điều gì đau, hãy ôm lấy. Nếu có điều gì vui, hãy mỉm cười cùng. Bạn không cố sửa, bạn chỉ hiện diện – điều đó đã đủ chữa lành rồi."
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