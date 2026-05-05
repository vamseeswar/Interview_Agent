import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlayCircle, Upload } from 'lucide-react';

const API_URL = "http://localhost:8000";

const Dashboard = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [experience, setExperience] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/sessions/start`, {
        username,
        job_role: role,
        experience_level: experience
      });
      navigate(`/interview/${res.data.session_id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to start session');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Start New Interview</h2>
      <form onSubmit={handleStart} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border" placeholder="Enter your username" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Job Role</label>
          <input required type="text" value={role} onChange={e => setRole(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border" placeholder="e.g. Machine Learning Engineer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Experience Level</label>
          <select value={experience} onChange={e => setExperience(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
        </div>
        
        <div className="pt-4">
          <button disabled={loading} type="submit" className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            {loading ? 'Starting...' : <><PlayCircle className="mr-2" /> Start Interview</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Dashboard;
