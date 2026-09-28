import React, { useState, useEffect, useRef } from "react";

import { API_BASE_URL } from "../config";

const QUICK_PROMPTS = [
  "What promo codes are available?",
  "What is the price of WMX Zebra Sandal?",
  "Tell me about your return policy",
  "Show items under $50",
];

export function ChatbotWidget({ isOpen, onToggle }) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Welcome to **BuyMore AI Support**! Ask me about any product prices, shipping, stock availability, or discount codes (**HALF50**).",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Sorry, I encountered an error checking our store knowledge base. Please try again!",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "🔥 Active Promo Code: Use **HALF50** at checkout for **50% OFF** your total cart order!\n\nStandard shipping takes 2-3 business days with free shipping over $50.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbot-widget-wrapper">
      {/* Floating Trigger Bubble */}
      <button
        className={`chatbot-trigger-btn ${isOpen ? "active" : ""}`}
        onClick={onToggle}
        title="AI Shopping Assistant"
      >
        {isOpen ? "✕" : "💬"}
        {!isOpen && <span className="chat-badge-dot" />}
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Chat Window Header */}
          <div className="chatbot-header">
            <div className="chatbot-title-wrap">
              <div className="bot-avatar">🤖</div>
              <div>
                <h3 className="bot-name">BuyMore Support AI</h3>
                <span className="bot-status">🟢 RAG Knowledge Base Active</span>
              </div>
            </div>
            <button className="chat-close-icon" onClick={onToggle}>
              ✕
            </button>
          </div>

          {/* Messages Feed */}
          <div className="chatbot-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>
                {msg.sender === "bot" && <div className="msg-avatar">🤖</div>}
                <div className="msg-bubble">
                  {msg.text.split("\n\n").map((paragraph, pIdx) => (
                    <p key={pIdx}>
                      {paragraph.split("**").map((chunk, cIdx) =>
                        cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message bot typing">
                <div className="msg-avatar">🤖</div>
                <div className="msg-bubble typing-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="quick-prompts-bar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                className="prompt-pill"
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="chatbot-input-form"
          >
            <input
              type="text"
              placeholder="Ask AI about prices, discounts, products..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
