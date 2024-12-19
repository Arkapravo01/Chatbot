const API_KEY = 'AIzaSyC0WpbQle_IqonYgA6sbZ7w2bpWf6_aHQ4';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-input');

async function generateResponse(prompt, imageData = null) {
    try {
        let contents = [{
            parts: []
        }];

        if (imageData) {
            contents[0].parts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: imageData.split(',')[1] // Remove the data:image/jpeg;base64, prefix
                }
            });
        }

        if (prompt) {
            contents[0].parts.push({
                text: prompt
            });
        }

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents })
        });

        if (!response.ok) {
            throw new Error('Failed to generate response');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function addMessage(message, isUser) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = message;

    messageElement.appendChild(messageContent);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleUserInput() {
    const userMessage = userInput.value.trim();
    
    if (userMessage) {
        addMessage(userMessage, true);
        userInput.value = '';
        sendButton.disabled = true;
        userInput.disabled = true;

        try {
            const botMessage = await generateResponse(userMessage);
            addMessage(botMessage, false);
        } catch (error) {
            addMessage('Sorry, I encountered an error. Please try again.', false);
        } finally {
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }
}

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.type.startsWith('image/')) {
            // Create a message element for the image
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message user-message';
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';

            // Create an image element and set its source
            const img = document.createElement('img');
            img.style.maxWidth = '100%';
            img.style.borderRadius = '5px';

            // Use FileReader to read and display the image
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageData = e.target.result;
                img.src = imageData;
                
                // Add image to chat
                messageContent.appendChild(img);
                messageDiv.appendChild(messageContent);
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // Get response from Gemini
                sendButton.disabled = true;
                userInput.disabled = true;
                
                try {
                    const prompt = "What's in this image?";
                    const botMessage = await generateResponse(prompt, imageData);
                    addMessage(botMessage, false);
                } catch (error) {
                    addMessage('Sorry, I encountered an error analyzing the image. Please try again.', false);
                } finally {
                    sendButton.disabled = false;
                    userInput.disabled = false;
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file');
        }
        
        // Clear the file input
        fileInput.value = '';
    }
});

sendButton.addEventListener('click', handleUserInput);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
    }
});