import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Interview from './components/Interview';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm px-6 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">AI Interview Prep Agent</h1>
        </nav>
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/interview/:sessionId" element={<Interview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
