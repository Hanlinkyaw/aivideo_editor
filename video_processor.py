#!/usr/bin/env python3
"""
Enhanced Video Processor with proper async handling, cancellation, and error management
"""

import os
import uuid
import time
import logging
import threading
import signal
import subprocess
import psutil
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class VideoProcessor:
    """Enhanced video processor with cancellation support"""
    
    def __init__(self):
        self.active_processes = {}  # Track PIDs for cancellation
        self.process_lock = threading.Lock()
    
    def register_process(self, job_id: str, process_info: Dict[str, Any]):
        """Register a process for tracking and cancellation"""
        with self.process_lock:
            self.active_processes[job_id] = {
                'pid': process_info.get('pid'),
                'thread': process_info.get('thread'),
                'subprocess': process_info.get('subprocess'),
                'created_at': time.time(),
                'status': 'running'
            }
    
    def unregister_process(self, job_id: str):
        """Unregister a process"""
        with self.process_lock:
            if job_id in self.active_processes:
                del self.active_processes[job_id]
    
    def cancel_process(self, job_id: str) -> bool:
        """Cancel a running process"""
        with self.process_lock:
            if job_id not in self.active_processes:
                return False
            
            process_info = self.active_processes[job_id]
            success = False
            
            # Try different cancellation methods
            try:
                # Method 1: Kill subprocess if exists
                if process_info.get('subprocess'):
                    try:
                        process_info['subprocess'].terminate()
                        time.sleep(1)
                        if process_info['subprocess'].poll() is None:
                            process_info['subprocess'].kill()
                        success = True
                        logger.info(f"Terminated subprocess for job {job_id}")
                    except Exception as e:
                        logger.warning(f"Failed to terminate subprocess: {e}")
                
                # Method 2: Kill PID if exists
                if process_info.get('pid'):
                    try:
                        os.kill(process_info['pid'], signal.SIGTERM)
                        time.sleep(1)
                        # Force kill if still running
                        if psutil.pid_exists(process_info['pid']):
                            os.kill(process_info['pid'], signal.SIGKILL)
                        success = True
                        logger.info(f"Killed process {process_info['pid']} for job {job_id}")
                    except ProcessLookupError:
                        success = True  # Process already dead
                    except Exception as e:
                        logger.warning(f"Failed to kill PID {process_info['pid']}: {e}")
                
                # Method 3: Mark thread for cancellation
                if process_info.get('thread'):
                    # Note: Python threads can't be forcefully killed, but we can set a flag
                    process_info['status'] = 'cancelled'
                    success = True
                    logger.info(f"Marked thread for job {job_id} as cancelled")
                
            except Exception as e:
                logger.error(f"Error cancelling process {job_id}: {e}")
            
            # Clean up
            self.unregister_process(job_id)
            return success
    
    def get_process_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a tracked process"""
        with self.process_lock:
            if job_id not in self.active_processes:
                return None
            
            process_info = self.active_processes[job_id]
            status = {
                'job_id': job_id,
                'status': process_info['status'],
                'pid': process_info.get('pid'),
                'created_at': process_info['created_at']
            }
            
            # Check if process is still alive
            if process_info.get('pid') and not psutil.pid_exists(process_info['pid']):
                status['status'] = 'completed'
            
            return status
    
    def cleanup_dead_processes(self):
        """Clean up dead processes"""
        with self.process_lock:
            dead_jobs = []
            for job_id, process_info in self.active_processes.items():
                if process_info.get('pid') and not psutil.pid_exists(process_info['pid']):
                    dead_jobs.append(job_id)
            
            for job_id in dead_jobs:
                self.unregister_process(job_id)
                logger.info(f"Cleaned up dead process for job {job_id}")


# Global processor instance
video_processor = VideoProcessor()


class CancellableThread(threading.Thread):
    """Thread that can be cancelled"""
    
    def __init__(self, target, args, job_id):
        super().__init__(target=target, args=args)
        self.job_id = job_id
        self._cancelled = False
        self._stop_event = threading.Event()
    
    def cancel(self):
        """Cancel the thread"""
        self._cancelled = True
        self._stop_event.set()
    
    def is_cancelled(self):
        """Check if thread is cancelled"""
        return self._cancelled or self._stop_event.is_set()
    
    def run(self):
        """Run with cancellation support"""
        try:
            # Register thread for cancellation
            video_processor.register_process(self.job_id, {
                'thread': self,
                'pid': None
            })
            
            # Run the target function
            if hasattr(self._target, '__self__'):
                # Method call
                if not self.is_cancelled():
                    self._target(*self._args)
            else:
                # Function call
                if not self.is_cancelled():
                    self._target(*self._args)
                    
        except Exception as e:
            logger.error(f"Thread error for job {self.job_id}: {e}")
        finally:
            video_processor.unregister_process(self.job_id)


def create_cancellable_thread(target, args, job_id):
    """Create a cancellable thread"""
    thread = CancellableThread(target, args, job_id)
    return thread


# Background cleanup thread
def start_cleanup_thread():
    """Start background cleanup of dead processes"""
    def cleanup_loop():
        while True:
            try:
                video_processor.cleanup_dead_processes()
                time.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Cleanup thread error: {e}")
                time.sleep(60)
    
    cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
    cleanup_thread.start()
    logger.info("Process cleanup thread started")
