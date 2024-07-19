let chatWindow = document.getElementById('chat-window');
let conversation = [];

function sendMessage() {
    let input = document.getElementById('chat-input');
    let message = input.value.trim();

    if (message !== '') {
        addMessage('User', message);
        conversation.push({ sender: 'User', message: message });
        input.value = '';

        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            addMessage('Bot', data.response);
            conversation.push({ sender: 'Bot', message: data.response });
        });
    }
}

function addMessage(sender, message) {
    let messageElement = document.createElement('div');
    messageElement.classList.add('message', sender.toLowerCase());
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function certifyConversation() {
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
            alert('Failed to certify the conversation.');
        }
    });
}
