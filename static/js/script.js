document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const conversationLog = document.getElementById('conversation-log');
    
    function sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value;
        if (message.trim() === '') return;
        
        // Send message to server
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            // Display user message and bot response
            data.logs.forEach(log => displayLog(log));
            displayMessage('Bot', data.response);
        });
        
        // Display user message
        displayMessage('User', message);
        input.value = '';
    }
    
    function displayMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${sender}: ${message}`;
        chatWindow.appendChild(messageElement);
    }

    function displayLog(log) {
        const logEntry = document.createElement('li');
        logEntry.className = 'list-group-item';
        logEntry.textContent = `${log.timestamp} - ${log.sender}: ${log.message} (Signature: ${log.signature})`;
        conversationLog.appendChild(logEntry);
    }

    window.sendMessage = sendMessage;

    window.certifyConversation = function(event) {
        // Prevent event propagation to parent button
        event.stopPropagation();

        // Gather conversation log
        const conversation = [];
        conversationLog.querySelectorAll('li').forEach((logItem) => {
            conversation.push(logItem.textContent);
        });

        fetch('/certify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversation: conversation })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Conversation certified successfully!');
            } else {
                alert('Failed to certify conversation.');
            }
        });
    };
});
