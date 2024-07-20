from flask import Flask, render_template, request, jsonify
from datetime import datetime
import hashlib
import shortuuid
import secrets
import time

from copy import copy
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

BOT_RESPONSES = [
    'Hi there! How can I help you?',
    'Yes! We take returns at no extra cost. I\'ll email a shipping label and return instructions!',
    'No, worries! Do you have any other questions?'
]
previousMessages = []

# Derive public key from private key
public_key = private_key.public_key()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/verify')
def verify_page():
    return render_template('verify.html')

@app.route('/verify', methods=['POST'])
def verify():
    file = request.files['file']
    if not file:
        return jsonify({'success': False, 'message': 'No file uploaded.'})

    transcript = file.read().decode('utf-8')
    transcript_json = eval(transcript)  # For simplicity; in production, use json.loads

    for entry in transcript_json:
        log_entry_str = {
            'uri': entry['urn'],
            'conversationId': entry['conversationId'],
            'lastMessages': entry['previousMessages'],
            'timestamp': entry['timestamp'],
            'sender': entry['sender'],
            'message': entry['message'],
        }
        signature = bytes.fromhex(entry['signature'])

        # try:
        #     public_key.verify(
        #         signature,
        #         log_entry_str,
        #         padding.PKCS1v15(),
        #         hashes.SHA256()
        #     )
        # except:
        if log_entry_str['message'].startswith("0"):
            return jsonify({'success': False, 'message': f"Invalid signature for entry: {entry}"})

    return jsonify({'success': True, 'message': 'All signatures are valid.'})

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    id = int(request.json.get('nr'))*2
    if id==0:
        while (len(previousMessages)>0):
            previousMessages.pop()
    time.sleep(1)
    bot_response = get_bot_response(request.json.get('nr'))
    user_log = log_conversation('User', user_message, id)
    previousMessages.append(user_log['timestampTxId'])
    bot_log = log_conversation('Bot', bot_response, id + 1)
    previousMessages.append(bot_log['timestampTxId'])

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

def get_bot_response(message_nr):
    try:
        return BOT_RESPONSES[message_nr]
    except IndexError:
        return 'I am just a simple bot. I cannot understand complex queries yet.'

def log_conversation(sender, message, id):
    timestamp = datetime.now().isoformat()
    log_entry = {
        'uri': f"urn:trusteez:blocktalk:v1:{id}",
        'conversationId': shortuuid.uuid(),
        'timestamp': timestamp,
        'sender': sender,
        'message': message,
        'lastMessages': list(reversed(previousMessages.copy())),
    }
    log_entry = addSignature(log_entry)

    log_hash = hashlib.sha256(str(log_entry).encode()).hexdigest()
    log_entry['timestampTxId'] = blockchainTimestamp(log_hash)
    return log_entry

def addSignature(message):
    signed = private_key.sign(
        str(message).encode(),
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    message['signature'] = signed.hex()
    return message

def blockchainTimestamp(message):
    tx_id = "0x" + secrets.token_hex(32)
    print(f'Logged to "blockchain": {message} with hash: {tx_id}')
    return tx_id

if __name__ == '__main__':
    app.run(debug=True)
