#!/usr/bin/env python3
"""
Test script for video editor functionality
"""

import requests
import json
import os
import time

BASE_URL = "http://localhost:5555"

def test_video_editor():
    """Test video upload and processing"""
    session = requests.Session()
    
    # Login
    login_data = {"username": "testuser", "password": "testpass"}
    response = session.post(f"{BASE_URL}/login", data=login_data)
    print(f"Login: {response.status_code}")
    
    if response.status_code != 200:
        print("Login failed")
        return
    
    # Create a test video file (small dummy file)
    test_video_path = "test_video.mp4"
    if not os.path.exists(test_video_path):
        # Create a minimal test file
        with open(test_video_path, "wb") as f:
            f.write(b"fake video content for testing")
    
    # Test upload with video editing options
    with open(test_video_path, "rb") as f:
        files = {"video": f}
        data = {
            "split_time": "6",
            "remove_time": "1",
            "output_quality": "1080p",
            "zoom_enabled": "on",
            "zoom_factor": "1.5",
            "zoom_type": "in",
            "mirror_enabled": "on",
            "mirror_type": "horizontal"
        }
        
        response = session.post(f"{BASE_URL}/upload", files=files, data=data)
        print(f"Upload response: {response.status_code}")
        print(f"Upload response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            job_id = result.get("job_id")
            print(f"Job ID: {job_id}")
            
            # Check status
            for i in range(10):
                response = session.get(f"{BASE_URL}/status/{job_id}")
                if response.status_code == 200:
                    status = response.json()
                    print(f"Status check {i+1}: {status}")
                    if status.get("status") in ["completed", "error"]:
                        break
                time.sleep(2)
        else:
            print("Upload failed")
    
    # Clean up
    if os.path.exists(test_video_path):
        os.remove(test_video_path)

if __name__ == "__main__":
    test_video_editor()
