from flask import Flask, request, jsonify
from flask_cors import CORS
from api.trials import TrialAPI
import logging
import os

app = Flask(__name__)
CORS(app, origins=["https://clinicrush.vercel.app"])

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# backend/app.py in the search_trials route
@app.route('/api/trials/search', methods=['GET'])
def search_trials():
    condition = request.args.get('condition', '')
    location = request.args.get('location', '')
    
    logger.debug(f"Searching trials for condition: {condition}, location: {location}")
    
    if not condition:
        return jsonify({"error": "Condition parameter is required"}), 400
    
    try:
        results = TrialAPI.search_trials(condition, location)
        if isinstance(results, dict) and 'error' in results:
            return jsonify(results), 500
        logger.debug(f"API returned {len(results) if isinstance(results, list) else 'error response'}")
        return jsonify(results)
    except Exception as e:
        logger.exception("An error occurred during trial search:")
        return jsonify({"error": str(e)}), 500
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 2000))
    app.run(host='0.0.0.0', port=port)