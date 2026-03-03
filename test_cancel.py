#!/usr/bin/env python3
"""
Test script for cancel functionality
"""

import requests
import json
import os
import time
import threading

BASE_URL = "http://localhost:5555"

def test_cancel_functionality():
    """Test video upload and cancel functionality"""
    session = requests.Session()
    
    # Login
    login_data = {"username": "testuser", "password": "testpass"}
    response = session.post(f"{BASE_URL}/login", data=login_data)
    print(f"Login: {response.status_code}")
    
    if response.status_code != 200:
        print("Login failed")
        return
    
    # Create a larger test video file to give us time to cancel
    test_video_path = "test_large_video.mp4"
    if not os.path.exists(test_video_path):
        # Create a larger test file
        with open(test_video_path, "wb") as f:
            f.write(b"fake video content for testing" * 10000)  # Larger file
    
    # Test upload with video editing options that will take time
    with open(test_video_path, "rb") as f:
        files = {"video": f}
        data = {
            "split_time": "1",  # Small segments to make processing longer
            "remove_time": "0.5",
            "output_quality": "1080p",
            "zoom_enabled": "on",
            "zoom_factor": "1.5",
            "zoom_type": "in",
            "zoom_timed": "on",
            "zoom_interval": "1",
            "zoom_duration": "1",
            "mirror_enabled": "on",
            "mirror_type": "horizontal",
            "blur_enabled": "on",
            "blur_radius": "5"
        }
        
        response = session.post(f"{BASE_URL}/upload", files=files, data=data)
        print(f"Upload response: {response.status_code}")
        print(f"Upload response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            job_id = result.get("job_id")
            print(f"Job ID: {job_id}")
            
            # Wait a bit then try to cancel
            def cancel_job():
                time.sleep(2)  # Wait 2 seconds before canceling
                print("Attempting to cancel job...")
                cancel_response = session.post(f"{BASE_URL}/cancel/{job_id}")
                print(f"Cancel response: {cancel_response.status_code}")
                print(f"Cancel response: {cancel_response.text}")
            
            cancel_thread = threading.Thread(target=cancel_job)
            cancel_thread.start()
            
            # Check status
            for i in range(15):
                response = session.get(f"{BASE_URL}/status/{job_id}")
                if response.status_code == 200:
                    status = response.json()
                    print(f"Status check {i+1}: {status}")
                    if status.get("status") in ["completed", "error", "cancelled"]:
                        break
                time.sleep(1)
            
            cancel_thread.join()
        else:
            print("Upload failed")
    
    # Clean up
    if os.path.exists(test_video_path):
        os.remove(test_video_path)

if __name__ == "__main__":
    test_cancel_functionality()
