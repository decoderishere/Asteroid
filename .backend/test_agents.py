#!/usr/bin/env python3
"""Test script for the agent system"""

import asyncio
import sys
import os
sys.path.append('.')

from agents.bess_orchestrator import BESSOrchestrator


async def test_agent_pipeline():
    """Test the complete agent pipeline"""
    
    # Create orchestrator
    orchestrator = BESSOrchestrator()
    
    # Subscribe to events for debugging
    def log_event(event):
        print(f"[{event.timestamp.strftime('%H:%M:%S')}] {event.agent_id}: {event.event_type} - {event.message}")
    
    orchestrator.subscribe_to_events(log_event)
    
    print("🚀 Testing BESS Agent Pipeline")
    print("=" * 50)
    
    # Start a test run
    query = "Chilean BESS Environmental Impact Assessment"
    max_docs = 5
    
    print(f"Starting generation for: '{query}' (max_docs: {max_docs})")
    run_id = await orchestrator.start_run(query, max_docs)
    print(f"Run ID: {run_id}")
    print()
    
    # Monitor progress
    while True:
        await asyncio.sleep(1)
        
        status = orchestrator.get_run_status(run_id)
        if not status:
            print("❌ Run not found!")
            break
        
        print(f"Status: {status['status']} | Progress: {status['progress']:.1f}% | Step: {status['current_step']}")
        
        if status['finished']:
            print()
            print("=" * 50)
            if status['status'] == 'succeeded':
                print("✅ Generation completed successfully!")
                result = status['result']
                if result:
                    print(f"📄 Generated {len(result['content_generation']['sections'])} sections")
                    print(f"📁 Files saved to: {result['document_assembly']['files']['directory']}")
                    
                    # Print markdown preview
                    markdown_content = result['document_assembly']['markdown']
                    print("\n📝 Document Preview (first 500 chars):")
                    print("-" * 30)
                    print(markdown_content[:500] + "..." if len(markdown_content) > 500 else markdown_content)
                    print("-" * 30)
                else:
                    print("⚠️ No result data available")
            else:
                print(f"❌ Generation failed: {status.get('error', 'Unknown error')}")
            break
    
    print(f"\nTotal events: {len(orchestrator.get_run_events(run_id))}")
    print("\n🎯 Test completed!")


if __name__ == "__main__":
    try:
        asyncio.run(test_agent_pipeline())
    except KeyboardInterrupt:
        print("\n\n⏹️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()