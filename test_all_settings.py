#!/usr/bin/env python3
"""
Comprehensive test script for all video editor settings
"""

import requests
import json
import os
import time

BASE_URL = "http://localhost:5555"

def create_test_video():
    """Create a test video file"""
    test_video_path = "test_valid.mp4"
    
    # Check if valid test video already exists
    if os.path.exists(test_video_path):
        return test_video_path
    
    # Create a valid MP4 file using ffmpeg
    import subprocess
    try:
        subprocess.run([
            'ffmpeg', '-f', 'lavfi', '-i', 'testsrc=duration=3:size=320x240:rate=1',
            '-f', 'lavfi', '-i', 'anullsrc=duration=3',
            '-c:v', 'libx264', '-c:a', 'aac', '-y', test_video_path
        ], capture_output=True, timeout=30)
        print(f"✅ Created valid test video: {test_video_path}")
    except Exception as e:
        print(f"❌ Failed to create test video: {e}")
        return None
    
    return test_video_path if os.path.exists(test_video_path) else None

def test_basic_upload():
    """Test basic upload without any effects"""
    print("\n=== TEST 1: Basic Upload (No Effects) ===")
    session = requests.Session()
    
    # Login
    login_data = {"username": "testuser", "password": "testpass"}
    response = session.post(f"{BASE_URL}/login", data=login_data)
    if response.status_code != 200:
        print("❌ Login failed")
        return False
    
    test_video = create_test_video()
    if not test_video:
        print("❌ Could not create test video")
        return False
    
    try:
        with open(test_video, "rb") as f:
            files = {"video": f}
            data = {
                "split_time": "3",
                "remove_time": "0.5",
                "output_quality": "720p",
                # Disable ALL effects
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
                print(f"✅ Job ID: {job_id}")
                
                # Monitor processing
                for i in range(10):
                    response = session.get(f"{BASE_URL}/status/{job_id}")
                    if response.status_code == 200:
                        status = response.json()
                        print(f"  Status {i+1}: {status.get('status')} - Progress: {status.get('progress')}%")
                        if status.get("status") in ["completed", "error", "cancelled"]:
                            print(f"  Final: {status.get('status')}")
                            return status.get("status") == "completed"
                    time.sleep(1)
            else:
                print(f"❌ Upload failed: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if os.path.exists(test_video):
            os.remove(test_video)
    
    return False

def test_timeline_settings():
    """Test different timeline settings"""
    print("\n=== TEST 2: Timeline Settings ===")
    session = requests.Session()
    
    # Login
    login_data = {"username": "testuser", "password": "testpass"}
    response = session.post(f"{BASE_URL}/login", data=login_data)
    if response.status_code != 200:
        print("❌ Login failed")
        return False
    
    test_video = create_test_video()
    if not test_video:
        print("❌ Could not create test video")
        return False
    
    try:
        with open(test_video, "rb") as f:
            files = {"video": f}
            data = {
                "split_time": "5",  # 5 second split
                "remove_time": "1",  # 1 second remove
                "output_quality": "1080p",
                # Disable effects to focus on timeline
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
            print(f"Timeline upload response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                job_id = result.get("job_id")
                print(f"✅ Timeline Job ID: {job_id}")
                
                # Monitor processing
                for i in range(10):
                    response = session.get(f"{BASE_URL}/status/{job_id}")
                    if response.status_code == 200:
                        status = response.json()
                        print(f"  Timeline Status {i+1}: {status.get('status')} - Progress: {status.get('progress')}%")
                        if status.get("status") in ["completed", "error", "cancelled"]:
                            print(f"  Timeline Final: {status.get('status')}")
                            return status.get("status") == "completed"
                    time.sleep(1)
            else:
                print(f"❌ Timeline upload failed: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Timeline Error: {e}")
        return False
    finally:
        if os.path.exists(test_video):
            os.remove(test_video)
    
    return False

def test_single_effect(effect_name, effect_data):
    """Test a single effect"""
    print(f"\n=== TEST: {effect_name} ===")
    session = requests.Session()
    
    # Login
    login_data = {"username": "testuser", "password": "testpass"}
    response = session.post(f"{BASE_URL}/login", data=login_data)
    if response.status_code != 200:
        print("❌ Login failed")
        return False
    
    test_video = create_test_video()
    if not test_video:
        print("❌ Could not create test video")
        return False
    
    try:
        with open(test_video, "rb") as f:
            files = {"video": f}
            # Base data
            data = {
                "split_time": "3",
                "remove_time": "0.5",
                "output_quality": "720p",
                # Disable all effects first
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
            # Add specific effect data
            data.update(effect_data)
            
            response = session.post(f"{BASE_URL}/upload", files=files, data=data)
            print(f"{effect_name} upload response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                job_id = result.get("job_id")
                print(f"✅ {effect_name} Job ID: {job_id}")
                
                # Monitor processing
                for i in range(15):
                    response = session.get(f"{BASE_URL}/status/{job_id}")
                    if response.status_code == 200:
                        status = response.json()
                        print(f"  {effect_name} Status {i+1}: {status.get('status')} - Progress: {status.get('progress')}%")
                        if status.get("status") in ["completed", "error", "cancelled"]:
                            result_status = status.get("status")
                            print(f"  {effect_name} Final: {result_status}")
                            return result_status == "completed"
                    time.sleep(1)
            else:
                print(f"❌ {effect_name} upload failed: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ {effect_name} Error: {e}")
        return False
    finally:
        if os.path.exists(test_video):
            os.remove(test_video)
    
    return False

def run_comprehensive_test():
    """Run comprehensive test of all settings"""
    print("🔍 COMPREHENSIVE VIDEO EDITOR TEST")
    print("=" * 50)
    
    results = []
    
    # Test 1: Basic upload
    results.append(("Basic Upload", test_basic_upload()))
    
    # Test 2: Timeline settings
    results.append(("Timeline Settings", test_timeline_settings()))
    
    # Test 3: Individual effects
    effects_to_test = [
        ("Zoom Effect", {
            "zoom_enabled": "on",
            "zoom_timed": "off",
            "zoom_factor": "1.5",
            "zoom_type": "in"
        }),
        ("Timed Zoom", {
            "zoom_enabled": "on",
            "zoom_timed": "on",
            "zoom_factor": "1.5",
            "zoom_type": "in",
            "zoom_interval": "7",  # Use same as default
            "zoom_duration": "2"   # Use same as default
        }),
        ("Freeze Effect", {
            "freeze_enabled": "on",
            "freeze_timed": "off",
            "freeze_duration": "1"
        }),
        ("Timed Freeze", {
            "freeze_enabled": "on",
            "freeze_timed": "on",
            "freeze_duration": "0.5",  # 0.5 second freeze
            "freeze_interval": "1"  # 1 second interval for 3-second video
        }),
        ("Mirror Effect", {
            "mirror_enabled": "on",
            "mirror_type": "horizontal"
        }),
        ("Rotate Effect", {
            "rotate_enabled": "on",
            "rotate_angle": "90"
        }),
        ("Blur Effect", {
            "blur_enabled": "on",
            "blur_radius": "5"
        })
    ]
    
    for effect_name, effect_data in effects_to_test:
        results.append((effect_name, test_single_effect(effect_name, effect_data)))
        time.sleep(2)  # Brief pause between tests
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<20} {status}")
        if result:
            passed += 1
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
    else:
        print(f"⚠️  {total - passed} tests failed - needs investigation")
    
    return passed == total

if __name__ == "__main__":
    run_comprehensive_test()
