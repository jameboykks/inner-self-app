// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { persona, messages } = req.body;

  const systemPrompt = persona.prompt || "Bạn là một người bạn đồng hành đầy cảm xúc.";

  const payload = {
    model: "gpt-4o", // hoặc gpt-3.5-turbo nếu bạn dùng bản free
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ],
    temperature: 0.8
  };

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await openaiRes.json();
  const reply = data.choices?.[0]?.message?.content || "Không có phản hồi.";

  res.status(200).json({ reply });
}
