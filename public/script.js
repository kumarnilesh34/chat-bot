const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatBody = document.getElementById('chat-body');
const symptomTags = document.getElementById('symptom-tags');
const predictBtn = document.getElementById('predict-btn');

let currentSymptoms = [];

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Parse markdown if bot
    if (sender === 'bot') {
        contentDiv.innerHTML = marked.parse(text);
    } else {
        contentDiv.textContent = text;
    }
    
    msgDiv.appendChild(contentDiv);
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function addTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot');
    msgDiv.id = 'typing-indicator';
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content', 'typing');
    contentDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    
    msgDiv.appendChild(contentDiv);
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function updateSymptomTags() {
    symptomTags.innerHTML = '';
    currentSymptoms.forEach(sym => {
        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.textContent = sym.replace(/_/g, ' ');
        symptomTags.appendChild(tag);
    });
}

async function sendMessageToBot(message) {
    addTypingIndicator();
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, currentSymptoms })
        });
        
        const data = await response.json();
        removeTypingIndicator();
        
        currentSymptoms = data.symptoms;
        updateSymptomTags();
        addMessage(data.reply, 'bot');
        
    } catch (error) {
        removeTypingIndicator();
        addMessage('Sorry, there was an error connecting to the server.', 'bot');
        console.error(error);
    }
}

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    chatInput.value = '';
    sendMessageToBot(message);
});

predictBtn.addEventListener('click', () => {
    addMessage('Please predict my disease.', 'user');
    sendMessageToBot('predict');
});

// Initial focus
chatInput.focus();
