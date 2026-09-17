import { useState } from "react";

export default function AIChatbot() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi Deepak! Ask me about your classes, attendance, or exam records.",
    },
  ]);
  const [input, setInput] = useState("");

  // TODO: POST { message: input } (JWT in headers, so user_id comes from the
  // token, not the client) to your chatbot.service.js endpoint. Each turn
  // the backend logs a CHATBOT_QUERY row (query_id, user_id, function_called)
  // for audit — nothing to build here, just don't try to set function_called
  // from the frontend.
  function handleSend() {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };

    const mockReply = {
      from: "bot",
      text: "This is a mock reply — connect this to the /api/chatbot endpoint once the backend is live.",
    };

    setMessages((prev) => [...prev, userMsg, mockReply]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-semibold text-navy-900 mb-1">AI Chatbot</h1>
      <p className="text-gray-500 text-sm mb-4">
        Ask about your students, attendance, or exam records.
      </p>

      <div className="flex-1 bg-white rounded-xl shadow-sm p-5 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-md px-4 py-2 rounded-xl text-sm ${
              m.from === "bot"
                ? "bg-canvas-offwhite text-navy-900"
                : "bg-navy-800 text-white ml-auto"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your question..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30"
        />
        <button
          onClick={handleSend}
          className="bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}