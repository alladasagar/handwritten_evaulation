import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import subprocess
import json
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for specific origins
allowed_origins = [
    "https://handwritten-evaulation.vercel.app",
]

CORS(app, resources={r"/*": {"origins": allowed_origins}})

# Set the path for uploaded files
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'jpg', 'jpeg', 'png', 'gif', 'bmp'}

# Ensure the uploads directory exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Route for testing the server
@app.route('/')
def home():
    return 'Welcome to the Handwritten Answer Evaluation API!'

# Route for evaluation
@app.route('/evaluate', methods=['POST'])
def evaluate():
    if 'image' not in request.files or 'answer' not in request.form:
        return jsonify({"error": "Image and answer are required"}), 400
    
    # Save uploaded image
    image = request.files['image']
    if image and allowed_file(image.filename):
        filename = secure_filename(image.filename)
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(image_path)
    else:
        return jsonify({"error": "Invalid file type"}), 400
    
    # Get predefined answer from form data
    predefined_answer = request.form['answer']
    
    # Define the path to Google Cloud credentials
    gcp_creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "path_to_your_credentials.json")
    
    # Run the Python evaluation script
    python_command = [
        'python3', 'evaluate.py',
        image_path,
        gcp_creds_path.replace('\\', '/'),  # Handle path cross-platform
        predefined_answer
    ]
    
    process = subprocess.Popen(python_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    
    # Handle errors from the Python script
    if stderr:
        return jsonify({"error": stderr.decode()}), 500
    
    # Parse the result from Python script
    try:
        result = json.loads(stdout.decode())
        os.remove(image_path)  # Clean up uploaded image
        return jsonify(result)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse Python output"}), 500

# Run Flask app on a suitable port
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
