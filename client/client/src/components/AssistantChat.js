// File: client/src/components/AssistantChat.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssistantChat.css';

const AssistantChat = () => {
const [messages, setMessages] = useState(
() => JSON.parse(localStorage.getItem('assistantMessages')) || []
);
const [query, setQuery] = useState('');
const [loading, setLoading] = useState(false);

const user = JSON.parse(localStorage.getItem('user'));
const API_URL = process.env.REACT_APP_API_URL || '[http://localhost:5000](http://localhost:5000)';

useEffect(() => {
localStorage.setItem('assistantMessages', JSON.stringify(messages));
}, [messages]);

const sendMessage = async () => {
if (!query.trim()) return;


setMessages((prev) => [...prev, { from: 'user', text: query }]);
const currentQuery = query;
setQuery('');
setLoading(true);

try {
  const res = await axios.post(`${API_URL}/api/assistant`, {
    email: user?.email?.toLowerCase(),
    query: currentQuery,
  });

  setMessages((prev) => [
    ...prev,
    { from: 'bot', text: res.data.answer || 'No response from the assistant.' },
  ]);
} catch (err) {
  console.error('Assistant error:', err);
  setMessages((prev) => [
    ...prev,
    {
      from: 'bot',
      text: err.response?.data?.message || 'An error occurred. Please try again later.',
    },
  ]);
} finally {
  setLoading(false);
}


};

return ( <div className="assistant-chat"> <div className="chat-messages">
{messages.map((msg, i) => (
<div key={i} className={`chat-message ${msg.from}`}>
{msg.text} </div>
))}


    {loading && <div className="chat-message bot thinking">⏳ Thinking...</div>}
  </div>

  <div className="chat-input">
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Ask about your tasks..."
      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      disabled={loading}
    />
    <button onClick={sendMessage} disabled={loading}>
      {loading ? '...' : 'Send'}
    </button>
  </div>
</div>


);
};

export default AssistantChat;
