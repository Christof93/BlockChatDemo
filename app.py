from flask import Flask, render_template, request, jsonify
from datetime import datetime
import hashlib

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    bot_response = get_bot_response(user_message)
    log_conversation('User', user_message)
    log_conversation('Bot', bot_response)
    return jsonify({'response': bot_response})

@app.route('/certify', methods=['POST'])
def certify():
    conversation = request.json.get('conversation')
    if not conversation:
        return jsonify({'success': False})
    
    # Create a hash of the entire conversation
    conversation_str = str(conversation)
    conversation_hash = hashlib.sha256(conversation_str.encode()).hexdigest()
    
    # Log the conversation hash (this simulates adding it to a blockchain)
    print(f'Certified conversation with hash: {conversation_hash}')
    
    return jsonify({'success': True})

def get_bot_response(message):
    if 'hello' in message.lower():
        return 'Hi there! How can I help you?'
    else:
        return 'I am just a simple bot. I cannot understand complex queries yet.'

def log_conversation(sender, message):
    timestamp = datetime.utcnow().isoformat()
    log_entry = {
        'timestamp': timestamp,
        'sender': sender,
        'message': message
    }
    log_hash = hashlib.sha256(str(log_entry).encode()).hexdigest()
    print(f'Logged to "blockchain": {log_entry} with hash: {log_hash}')

if __name__ == '__main__':
    app.run(debug=True)
