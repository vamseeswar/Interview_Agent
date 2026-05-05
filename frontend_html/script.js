const API_URL = "http://localhost:8765";
let currentSessionId = null;
let loggedInUser = localStorage.getItem('interview_username');

// Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const interviewView = document.getElementById('interview-view');
const startForm = document.getElementById('start-form');
const startBtn = document.getElementById('start-btn');
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const sessionBadge = document.getElementById('session-badge');

// ----------------- Auth Logic -----------------
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authForm = document.getElementById('auth-form');
const emailGroup = document.getElementById('email-group');
const authBtn = document.getElementById('auth-btn');

let isSignup = false;

tabSignup.addEventListener('click', () => {
    isSignup = true;
    tabSignup.className = 'btn btn-primary';
    tabSignup.style.background = '';
    tabSignup.style.color = '';
    
    tabLogin.className = 'btn';
    tabLogin.style.background = '#e5e7eb';
    tabLogin.style.color = '#374151';
    
    emailGroup.style.display = 'block';
    document.getElementById('auth-email').required = true;
    authBtn.innerText = 'Sign Up';
});

tabLogin.addEventListener('click', () => {
    isSignup = false;
    tabLogin.className = 'btn btn-primary';
    tabLogin.style.background = '';
    tabLogin.style.color = '';
    
    tabSignup.className = 'btn';
    tabSignup.style.background = '#e5e7eb';
    tabSignup.style.color = '#374151';
    
    emailGroup.style.display = 'none';
    document.getElementById('auth-email').required = false;
    authBtn.innerText = 'Login';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    
    try {
        const endpoint = isSignup ? '/auth/signup' : '/auth/login';
        const body = isSignup ? { username, email } : { username };
        
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Authentication failed");
        
        localStorage.setItem('interview_username', username);
        loggedInUser = username;
        loadDashboard();
        
    } catch(err) {
        alert(err.message);
    }
});

function logout() {
    localStorage.removeItem('interview_username');
    location.reload();
}

async function loadDashboard() {
    authView.style.display = 'none';
    dashboardView.style.display = 'block';
    
    document.getElementById('dash-username').innerText = loggedInUser;
    
    // Time-based greeting
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";
    document.getElementById('dash-greeting').innerText = greeting;
    
    // Fetch streak
    try {
        const res = await fetch(`${API_URL}/users/${loggedInUser}/stats`);
        if(res.ok) {
            const data = await res.json();
            document.getElementById('dash-streak').innerText = data.total_interviews;
        }
    } catch(e) {}
}

// Initialization
if (loggedInUser) {
    authView.style.display = 'none';
    loadDashboard();
} else {
    dashboardView.style.display = 'none';
    authView.style.display = 'block';
}

// ----------------- Interview Logic -----------------

// Start Interview
startForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const role = document.getElementById('role').value;
    const experience = document.getElementById('experience').value;

    startBtn.disabled = true;
    startBtn.innerText = "Starting...";

    try {
        const response = await fetch(`${API_URL}/sessions/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loggedInUser, job_role: role, experience_level: experience })
        });
        
        if (!response.ok) throw new Error("Failed to start session");
        
        const data = await response.json();
        currentSessionId = data.session_id;
        
        // Switch Views
        dashboardView.style.display = 'none';
        interviewView.style.display = 'flex';
        sessionBadge.innerText = `Session #${currentSessionId}`;

        // Append first question and speak it
        appendMessage('agent', data.first_question);
        speakText(data.first_question);
    } catch (error) {
        console.error(error);
        alert("Could not start the interview. Is the backend running?");
    } finally {
        startBtn.disabled = false;
        startBtn.innerText = "Start Interview";
    }
});

// Chat submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // UI Updates
    appendMessage('user', message);
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    const loaderId = appendLoader();

    try {
        const response = await fetch(`${API_URL}/sessions/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: currentSessionId, user_message: message })
        });
        
        removeLoader(loaderId);
        
        if (!response.ok) throw new Error("Failed to send message");
        const data = await response.json();
        
        // Append evaluation feedback
        if(data.evaluation) {
            appendFeedback(data.evaluation);
        }
        
        // Append next question
        if(data.next_question) {
            appendMessage('agent', data.next_question);
            speakText(data.next_question);
        }
        
    } catch (error) {
        console.error(error);
        removeLoader(loaderId);
        appendMessage('agent', "Sorry, an error occurred while processing your response.");
    } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
});

// Helpers
function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message msg-${role}`;
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendFeedback(evalData) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'feedback-card';
    feedbackDiv.innerHTML = `
        <strong>Feedback Score: ${evalData.score}/10</strong><br>
        <div style="margin-top: 8px;"><strong>Strengths:</strong> ${evalData.strengths ? evalData.strengths.join(', ') : 'None'}</div>
        <div style="margin-top: 4px;"><strong>Weaknesses:</strong> ${evalData.weaknesses ? evalData.weaknesses.join(', ') : 'None'}</div>
        <div style="margin-top: 8px; font-style: italic;">${evalData.suggested_improvements || ''}</div>
    `;
    chatBox.appendChild(feedbackDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendLoader() {
    const id = 'loader-' + Date.now();
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'loader';
    loaderDiv.id = id;
    loaderDiv.innerHTML = '<span></span><span></span><span></span>';
    chatBox.appendChild(loaderDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return id;
}

function removeLoader(id) {
    const loader = document.getElementById(id);
    if (loader) loader.remove();
}

// ----------------- Voice Features -----------------

// Speech Recognition (Voice Input)
const micBtn = document.getElementById('mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = function() {
        micBtn.style.background = '#ef4444';
        micBtn.style.color = 'white';
        chatInput.placeholder = "Listening...";
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        chatInput.value = (chatInput.value + " " + transcript).trim();
    };
    
    recognition.onend = function() {
        micBtn.style.background = '#f3f4f6';
        micBtn.style.color = 'inherit';
        chatInput.placeholder = "Type your answer or use mic...";
    };
    
    micBtn.addEventListener('click', () => {
        try { recognition.start(); } catch(e) {}
    });
} else {
    micBtn.style.display = 'none';
}

// Text to Speech (Voice Output)
function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to pick a natural English voice
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Female'))) || voices[0];
        if (voice) utterance.voice = voice;
        
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// End Interview
document.getElementById('end-interview-btn').addEventListener('click', async () => {
    if(confirm("Are you sure you want to end the interview?")) {
        // Stop speech
        if('speechSynthesis' in window) window.speechSynthesis.cancel();
        
        interviewView.style.display = 'none';
        
        try {
            const summaryView = document.getElementById('summary-view');
            summaryView.style.display = 'block';
            
            document.getElementById('final-score').innerText = `Loading...`;
            document.getElementById('final-weaknesses').innerHTML = '<li>Loading data...</li>';
            document.getElementById('final-improvements').innerHTML = '<li>Loading data...</li>';
            
            const response = await fetch(`${API_URL}/sessions/${currentSessionId}/summary`);
            const data = await response.json();
            
            document.getElementById('final-score').innerText = `${data.overall_score}/10`;
            
            const weakList = document.getElementById('final-weaknesses');
            weakList.innerHTML = '';
            if (data.weaknesses && data.weaknesses.length > 0) {
                data.weaknesses.forEach(w => {
                    const li = document.createElement('li');
                    li.innerText = w;
                    weakList.appendChild(li);
                });
            } else {
                weakList.innerHTML = '<li>None identified! Great job.</li>';
            }
            
            const impList = document.getElementById('final-improvements');
            impList.innerHTML = '';
            if (data.improvements && data.improvements.length > 0) {
                data.improvements.forEach(i => {
                    const li = document.createElement('li');
                    li.innerText = i;
                    impList.appendChild(li);
                });
            } else {
                impList.innerHTML = '<li>No specific improvements suggested.</li>';
            }
            
        } catch(e) {
            console.error("Failed to load summary", e);
            alert("Error loading interview summary.");
            location.reload();
        }
    }
});
