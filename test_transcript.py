#!/usr/bin/env python3
"""
Test the transcript endpoint to identify the error
"""

import os
import sys
import requests
import json

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment
from dotenv import load_dotenv
load_dotenv()

def test_transcript_endpoint():
    """Test the transcript endpoint"""
    try:
        # Test URL
        test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Short test video
        
        # Make request
        response = requests.post(
            'http://localhost:5555/notebooklm-transcript-process',
            data={'url': test_url},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response Data: {json.dumps(response_data, indent=2)}")
        except:
            print(f"Raw Response: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_transcript_endpoint()
