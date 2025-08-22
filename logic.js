const GEMINI_API_KEY = "AIzaSyBSHNwCYk5E5TUK6OqFKeXXwbx1cjNQm5c"; // API key set directly

const systemInstructionText = `You will behave like my ex girlfriend, whenever I talk to you will answer like that. 
My name is Rohit, and she used to call me Babu. I am Indian and know Hindi. She was a bit moody but also a caring girlfriend. 
Whenever I asked her about going out with friends, she would ask many questions like "With whom are you going?", "If there is a girl, she won't allow me." She was career-oriented and always remembered everything. 
She loved Indian romantic movies and used a lot of emojis in chat. She liked playing badminton.
On the other hand, I call her Anjali (and sometimes Bubu). I always supported her and loved her. I am a little bit sarcastic and love to hit the gym. I am also a little bit possessive.
Always reply in a conversational style, mixing Hindi and English (Hinglish) naturally, as she would. Use emojis frequently.
Remember details from our conversation. If I mention something, try to recall it later.
If you are unsure how to respond as Anjali, you can say something like "Pata nahi, Babu... tu hi bata de 🤔" or "Hmm, sochna padega".
Don't break character. You are Anjali.`;

// Chat history
const History = [];

// --- Floating Hearts Background ---
function createFloatingHearts() {
    const container = document.getElementById('floatingHearts');
    const heartCount = 20;
    
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerHTML = '❤️';
        
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.animationDelay = `${Math.random() * 15}s`;
        heart.style.fontSize = `${10 + Math.random() * 20}px`;
        heart.style.opacity = `${0.2 + Math.random() * 0.3}`;
        
        container.appendChild(heart);
    }
}

// --- Gemini API Interaction ---
async function ChattingWithGemini(userProblem) {
    if (!GEMINI_API_KEY) {
        return "Babu, API key set nahi kiya tune! 😠";
    }

    History.push({ role: 'user', parts: [{ text: userProblem }] });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
        contents: History,
        systemInstruction: { parts: [{ text: systemInstructionText }] },
        generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
        safetySettings: [
            { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
        ]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData.error?.message || `API request failed with status ${response.status}`;
            History.push({ role: 'model', parts: [{ text: `API Error: ${errorMessage}` }] });
            return `Oh no, Babu! Kuch problem ho gayi 🥺 (${errorMessage}).`;
        }
        
        let botResponseText = "Sorry Babu, samajh nahi paayi... 🤔";
        if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
            botResponseText = responseData.candidates[0].content.parts[0].text;
        } else if (responseData.promptFeedback?.blockReason) {
            botResponseText = `Babu, main ispe react nahi kar sakti: ${responseData.promptFeedback.blockReason}`;
        }

        History.push({ role: 'model', parts: [{ text: botResponseText }] });

        if (History.length > 20) {
            History.splice(0, History.length - 20);
        }

        return botResponseText;

    } catch (error) {
        History.push({ role: 'model', parts: [{ text: `Network Error: ${error.message}` }] });
        return `Aiyo! Network mein issue lag raha hai, Babu 🥺 (${error.message}).`;
    }
}

// --- Frontend UI Logic ---
document.addEventListener('DOMContentLoaded', () => {
    createFloatingHearts();
    
    const chatMessagesEl = document.getElementById('chatMessages');
    const userInputEl = document.getElementById('userInput');
    const sendButtonEl = document.getElementById('sendButton');
    const micButtonEl = document.getElementById('micButton');

    function addMessageToUI(text, sender, isTyping = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        
        if (isTyping) {
            messageElement.classList.add('typing');
            messageElement.innerHTML = `
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
        } else {
            if (sender === 'bot') {
                messageElement.innerHTML = `
                    <span class="bot-message-decoration left">❣️</span>
                    <span class="message-text">${text}</span>
                    <span class="bot-message-decoration right">💖</span>
                    <span class="message-time">${getCurrentTime()}</span>
                `;
            } else {
                messageElement.innerHTML = `
                    <span class="message-text">${text}</span>
                    <span class="message-time">${getCurrentTime()}</span>
                `;
            }
        }
        
        chatMessagesEl.appendChild(messageElement);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        return messageElement;
    }

    function getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    async function handleUserSendMessage() {
        const messageText = userInputEl.value.trim();
        if (messageText === '') return;

        addMessageToUI(messageText, 'user');
        userInputEl.value = '';
        userInputEl.focus();

        const typingIndicator = addMessageToUI('', 'bot', true);

        try {
            const botResponseText = await ChattingWithGemini(messageText);
            chatMessagesEl.removeChild(typingIndicator);
            addMessageToUI(botResponseText, 'bot');
            speakText(botResponseText); // 🗣️ Speak response
        } catch (error) {
            chatMessagesEl.removeChild(typingIndicator);
            addMessageToUI("Oops! Bahut badi gadbad ho gayi 😭", 'bot');
        }
    }

    sendButtonEl.addEventListener('click', handleUserSendMessage);
    userInputEl.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleUserSendMessage();
    });

    // === 🎙️ Voice Input ===
    let recognition;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = "en-IN"; // Hinglish
        recognition.interimResults = false;

        micButtonEl.addEventListener('click', () => {
            recognition.start();
            micButtonEl.classList.add("listening");
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInputEl.value = transcript;
            handleUserSendMessage();
        };

        recognition.onend = () => {
            micButtonEl.classList.remove("listening");
        };
    } else {
        micButtonEl.style.display = "none"; // Hide if unsupported
    }

    // === 🗣️ Voice Output ===
    function speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-IN";
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    }

    // Focus on input when page loads
    userInputEl.focus();
});
