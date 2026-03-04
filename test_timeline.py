#!/usr/bin/env python3
"""
Test script to debug timeline split and remove functionality
"""

import requests
import json
import os
import time

BASE_URL = "http://localhost:5555"

def test_timeline_settings():
    """Test video upload with different timeline settings"""
    session = requests.Session()
    
    # Login
    login_data = {"username": "testuser", "password": "testpass"}
    response = session.post(f"{BASE_URL}/login", data=login_data)
    print(f"Login: {response.status_code}")
    
    if response.status_code != 200:
        print("Login failed")
        return
    
    # Use existing video file
    uploads_dir = "/Users/hanlinkyaw/Discovery_Channel/Downloaded/video_editor_web/uploads"
    existing_videos = [f for f in os.listdir(uploads_dir) if f.endswith('.mp4')]
    if existing_videos:
        import shutil
        existing_path = os.path.join(uploads_dir, existing_videos[0])
        test_video_path = "timeline_test.mp4"
        shutil.copy(existing_path, test_video_path)
        print(f"Using existing video: {existing_videos[0]}")
    else:
        print("No existing video files found")
        return
    
    # Test with different timeline settings
    test_cases = [
        {"split_time": "3", "remove_time": "0.5", "description": "3 second split, 0.5 second remove"},
        {"split_time": "6", "remove_time": "1", "description": "6 second split, 1 second remove"},
        {"split_time": "10", "remove_time": "2", "description": "10 second split, 2 second remove"}
    ]
    
    for i, test_case in enumerate(test_cases):
        print(f"\n=== Test Case {i+1}: {test_case['description']} ===")
        
        with open(test_video_path, "rb") as f:
            files = {"video": f}
            data = {
                "split_time": test_case["split_time"],
                "remove_time": test_case["remove_time"],
                "output_quality": "1080p",
                # Disable all effects to focus on timeline
                "zoom_enabled": "off",
                "freeze_enabled": "off",
                "mirror_enabled": "off",
                "rotate_enabled": "off",
                "blur_enabled": "off",
                "glitch_enabled": "off",
                "oldfilm_enabled": "off",
                "speed_enabled": "off",
                "text_enabled": "off",
                "music_enabled": "off",
                "noise_reduction": "off"
            }
            
            response = session.post(f"{BASE_URL}/upload", files=files, data=data)
            print(f"Upload response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                job_id = result.get("job_id")
                print(f"Job ID: {job_id}")
                
                # Monitor processing with detailed logging
                for j in range(20):
                    response = session.get(f"{BASE_URL}/status/{job_id}")
                    if response.status_code == 200:
                        status = response.json()
                        print(f"  Status {j+1}: {status.get('status')} - Progress: {status.get('progress')}%")
                        if status.get("status") in ["completed", "error", "cancelled"]:
                            print(f"  Final status: {status}")
                            break
                    time.sleep(1)
            else:
                print("Upload failed")
                print(f"Error: {response.text}")
    
    # Clean up
    if os.path.exists(test_video_path):
        os.remove(test_video_path)

if __name__ == "__main__":
    test_timeline_settings()
