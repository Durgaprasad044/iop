document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const apiKeyContainer = document.getElementById('apiKeyContainer');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKeyButton');
    const chatInterface = document.getElementById('chatInterface');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const toggleListeningButton = document.getElementById('toggleListeningButton');
  
    // State variables
    let messages = [];
    let isListening = false;
    let geminiApiKey = '';
    let apiKeySet = false;
    let recognition = null;
    
    // API key constants
    const API_KEY_STORAGE_NAME = 'AIzaSyDyFUmT8OtZdJDHzc0R1Ro-pBdJrSjIkDc';
    
    // Initialize speech recognition
    const initializeSpeechRecognition = () => {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          messageInput.value = transcript;
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          isListening = false;
          toggleListeningButton.textContent = 'Start Listening';
          toggleListeningButton.classList.remove('active');
        };
      } else {
        console.error('Speech recognition not supported in this browser');
        addMessage('System', 'Speech recognition is not supported in this browser.');
      }
    };
    
    // Function to add a message to the chat
    const addMessage = (sender, text) => {
      const message = { sender, text, id: Date.now() };
      messages.push(message);
      
      const messageElement = document.createElement('div');
      messageElement.className = `message ${sender.toLowerCase()}-message`;
      
      const senderElement = document.createElement('div');
      senderElement.className = 'message-sender';
      senderElement.textContent = sender;
      
      const textElement = document.createElement('div');
      textElement.className = 'message-text';
      textElement.textContent = text;
      
      messageElement.appendChild(senderElement);
      messageElement.appendChild(textElement);
      
      messagesContainer.appendChild(messageElement);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    
    // Function to save API key
    const saveApiKey = () => {
      const key = apiKeyInput.value.trim();
      if (key) {
        geminiApiKey = key;
        apiKeySet = true;
        // Store the API key in localStorage
        localStorage.setItem(API_KEY_STORAGE_NAME, key);
        
        // Hide API key container and show chat interface
        apiKeyContainer.style.display = 'none';
        chatInterface.style.display = 'flex';
        
        addMessage('System', 'API key set successfully. You can now use the IRIS!');
      }
    };
    
    // Function to toggle speech recognition
    const toggleListening = () => {
      if (!recognition) {
        initializeSpeechRecognition();
      }
      
      if (isListening) {
        recognition.stop();
        isListening = false;
        toggleListeningButton.textContent = 'Start Listening';
        toggleListeningButton.classList.remove('active');
      } else {
        recognition.start();
        isListening = true;
        toggleListeningButton.textContent = 'Stop Listening';
        toggleListeningButton.classList.add('active');
      }
    };
    
    // Function to send message to Gemini API
    const sendMessageToGemini = async (text) => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: text
                  }
                ]
              }
            ]
          })
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Unknown error from API');
        }
        
        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        console.error('API error:', error);
        return 'Error processing message: ' + error.message;
      }
    };
    
    // Function to handle sending messages
    const handleSendMessage = async () => {
      const text = messageInput.value.trim();
      if (!text || !apiKeySet) return;
      
      addMessage('User', text);
      messageInput.value = '';
      
      try {
        const response = await sendMessageToGemini(text);
        addMessage('Iris', response);
      } catch (error) {
        console.error('Error sending message:', error);
        addMessage('System', 'Failed to get response. Please try again.');
      }
    };
    
    // Initialize the application
    const initialize = () => {
      // Check for saved API key
      const savedApiKey = localStorage.getItem(API_KEY_STORAGE_NAME);
      if (savedApiKey) {
        geminiApiKey = savedApiKey;
        apiKeySet = true;
        
        // Hide API key container and show chat interface
        apiKeyContainer.style.display = 'none';
        chatInterface.style.display = 'flex';
        
        addMessage('System', 'Welcome back! Your API key has been loaded.');
      } else {
        addMessage('System', 'Please enter your Google Gemini API key to begin.');
      }
      
      // Initialize speech recognition
      initializeSpeechRecognition();
      
      // Event listeners
      saveApiKeyButton.addEventListener('click', saveApiKey);
      toggleListeningButton.addEventListener('click', toggleListening);
      sendMessageButton.addEventListener('click', handleSendMessage);
      
      // Send message on Enter key
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleSendMessage();
        }
      });
    };
    
    // Start the application
    initialize();
  });