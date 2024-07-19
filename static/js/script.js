document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const conversationLog = document.getElementById('conversation-log');
    const QUESTIONS = [
        "Hi!",
        "I received a faulty product. Can I return it for free?",
        "Thank you!",
    ]
    questionIndex=0
    document.getElementById('chat-input').value = QUESTIONS[questionIndex]

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
            body: JSON.stringify({ message: message, nr: questionIndex })
        })
        .then(response => response.json())
        .then(data => {
            // Display user message and bot response
            data.logs.forEach(log => displayLog(log));
            chatWindow.children.item(chatWindow.children.length-1).remove()
            displayMessage('Bot', data.response);
            if (questionIndex < QUESTIONS.length - 1) {
                input.value = QUESTIONS[++questionIndex]
            } else {
                questionIndex=0
                input.value = QUESTIONS[questionIndex]
            }
        });
        
        // Display user message
        displayMessage('User', message);
        displayMessage('Bot', '...');

        input.value = '';
    }
    
    function displayMessage(sender, message) {
        const messageElement = document.createElement('div')
        messageElement.classList.add(
            "message",
            sender.toLowerCase()
        );
        messageElement.innerHTML = `<strong>${sender}</strong>: ${message}`;
        chatWindow.appendChild(messageElement);
    }

    function displayLog(log) {
        const logEntry = document.createElement('li');
        logEntry.className = 'list-group-item';
        
        // Shorten the signature for display
        const shortSignature = log.signature.substring(0, 10) + '...';
        
        // Create a JSON object for the log
        const logObject = {
            timestamp: log.timestamp,
            sender: log.sender,
            message: log.message,
            signature: shortSignature,
            urn: log.uri,
            conversationId: log.conversationId,
            TimestampTxId: log.TimestampTxId,
            previousMessages: log.lastMessages,
        };
        
        logEntry.textContent = JSON.stringify(logObject, null, 2);
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
                alert('Conversation verified successfully!');
            } else {
                alert('Failed to verify conversation.');
            }
        });
    };
});
