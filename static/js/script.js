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
        const shortSignature = log.signature
        
        // Create a JSON object for the log
        const logObject = {
            urn: log.uri,
            conversationId: log.conversationId,
            timestamp: log.timestamp,
            sender: log.sender,
            message: log.message,
            previousMessages: log.lastMessages,
            signature: shortSignature,
            TimestampTxId: log.TimestampTxId,
        };
        stringEntry = JSON.stringify(logObject, null, 2)
        console.log(stringEntry)
        logEntry.innerHTML = "<pre>" + stringEntry + "</pre>"

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

    downloadTranscript = function() {
        // Gather conversation log
        const conversation = [];
        conversationLog.querySelectorAll('li').forEach((logItem) => {
            const logObject = JSON.parse(logItem.textContent);
            logObject.signature = logObject.signature.replace('...', '');
            conversation.push(logObject);
        });

        const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'conversation_transcript.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
});
