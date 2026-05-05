import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Send, Mic, Activity } from 'lucide-react';

const API_URL = "http://localhost:8000";

interface Message {
  role: 'agent' | 'user';
  content: string;
  feedback?: any;
}

const Interview = () => {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch history or get the first question
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/sessions/${sessionId}/history`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/sessions/chat`, {
        session_id: parseInt(sessionId || '0'),
        user_message: userMsg
      });

      setMessages(prev => {
        const newMsgs = [...prev];
        // Add feedback to the last user message
        newMsgs[newMsgs.length - 1].feedback = res.data.evaluation;
        // Add new agent message
        newMsgs.push({ role: 'agent', content: res.data.next_question });
        return newMsgs;
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center"><Activity className="mr-2" /> Live Interview Session</h2>
        <span className="text-sm bg-indigo-800 px-3 py-1 rounded-full">Session #{sessionId}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
            {msg.role === 'user' && msg.feedback && (
              <div className="max-w-[80%] mt-2 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 shadow-sm">
                <strong>Feedback Score: {msg.feedback.score}/10</strong>
                <div className="mt-1"><strong>Strengths:</strong> {msg.feedback.strengths?.join(', ')}</div>
                <div className="mt-1"><strong>Weaknesses:</strong> {msg.feedback.weaknesses?.join(', ')}</div>
                <div className="mt-1 italic mt-2">{msg.feedback.suggested_improvements}</div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 rounded-bl-none shadow-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <button type="button" className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition">
            <Mic size={24} />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type your answer here..."
            className="flex-1 rounded-full border-gray-300 shadow-sm px-6 py-3 border focus:border-indigo-500 focus:ring-indigo-500 outline-none"
          />
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition disabled:opacity-50">
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Interview;
