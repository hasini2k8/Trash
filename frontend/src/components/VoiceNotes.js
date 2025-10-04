import React, { useState } from "react";
import "./VoiceNotes.css";

export default function VoiceNotes() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }]);
    setInput("");
  };

  return (
    <div className="voicenotes-widget">
      {/* Header Row */}
      <div className="vn-header">
        <button className="btn brown">Export Notes</button>
        <button className="btn red">Stop Recording!</button>
        <button className="btn brown">Start Recording!</button>

        <select className="vn-droplist">
          <option>Droplist</option>
          <option>Gen A</option>
          <option>Gen Z</option>
          <option>Millennial</option>
          <option>Professional</option>
        </select>
      </div>

      {/* Main Body */}
      <div className="vn-body">
        {/* White speech bubble panel (left) */}
        <div className="vn-panel">
          {messages.length === 0 ? (
            <div className="placeholder">Type a question below to ask Tommy...</div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`msg ${msg.role === "user" ? "user" : "ai"}`}
              >
                {msg.text}
              </div>
            ))
          )}
        </div>

        {/* Avatar column */}
        <div className="vn-avatar-col">
          

          <div className="vn-avatar">
            {/* Placeholder for illustration */}
          </div>

          <div className="vn-meta">
            <div className="vn-name">Tommy</div>
            <div className="vn-sub">2nd year brother<br />from MIT</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="vn-footer">
        <input
          type="text"
          className="vn-input"
          placeholder="Ask Tommy"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="vn-send" onClick={handleSend}>▶</button>
      </div>
    </div>
  );
}
