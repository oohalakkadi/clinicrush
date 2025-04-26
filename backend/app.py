from flask import Flask, request, jsonify
from flask_cors import CORS
from api.trials import TrialAPI

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/trials/search', methods=['GET'])
def search_trials():
    condition = request.args.get('condition', '')
    location = request.args.get('location', '')
    
    if not condition:
        return jsonify({"error": "Condition parameter is required"}), 400
    
    results = TrialAPI.search_trials(condition, location)
    return jsonify(results)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=2000)