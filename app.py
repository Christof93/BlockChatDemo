from flask import Flask, render_template, request, jsonify
from datetime import datetime
import hashlib
import shortuuid

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric.padding import PKCS1v15
from cryptography.hazmat.backends import default_backend

app = Flask(__name__)

private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)

# Derive public key from private key
public_key = private_key.public_key()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    id = request.json.get('id')
    bot_response = get_bot_response(user_message)
    user_log = log_conversation('User', user_message, id)
    bot_log = log_conversation('Bot', bot_response, id)
    return jsonify({'response': bot_response, 'logs': [user_log, bot_log]})

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

def log_conversation(sender, message, id):
    timestamp = datetime.now().isoformat()
    log_entry = {
        'uri':f"urn:trusteez:blocktalk:v1:{id}",
        'conversationId': shortuuid.uuid(),
        'timestamp': timestamp,
        'sender': sender,
        'message': message,
        'lastMessages': getLastMessages()
    }
    signed = private_key.sign(
        str(log_entry).encode(),
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    log_entry['signature'] = signed.hex()

    log_hash = hashlib.sha256(str(log_entry).encode()).hexdigest()
    print(f'Logged to "blockchain": {log_entry} with hash: {log_hash}')

    return log_entry

def getLastMessages():
    return []

if __name__ == '__main__':
    app.run(debug=True)
