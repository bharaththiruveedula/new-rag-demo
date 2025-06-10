
import requests
import json
import time
from datetime import datetime

def test_analytics_endpoint():
    """
    Test the analytics endpoint to verify it returns real data and not mock values.
    
    Specifically checks:
    1. total_suggestions: Real count from database
    2. successful_suggestions: Real count of suggestions with confidence > 0.5
    3. avg_confidence: Real average confidence from database
    4. avg_processing_time: Real average processing time from database
    5. total_merge_requests: Should be 0 (no mock calculation)
    6. successful_merge_requests: Should be 0 (no mock calculation)
    7. top_ticket_types: Real data based on ticket summaries or empty array
    8. usage_by_day: Real data from database
    """
    base_url = "https://c624a4bd-9719-44d8-8b44-e52e7972801c.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("\n" + "="*80)
    print("ANALYTICS ENDPOINT VERIFICATION")
    print("="*80)
    
    # Get analytics data
    print("\n🔍 Fetching analytics data...")
    response = requests.get(f"{api_url}/analytics")
    
    if response.status_code != 200:
        print(f"❌ Failed to get analytics data: {response.status_code}")
        return False
    
    analytics = response.json()
    
    # Print all analytics data
    print("\n📊 Current Analytics Data:")
    print(json.dumps(analytics, indent=2))
    
    # Verify required fields exist
    required_fields = [
        'total_suggestions', 'successful_suggestions', 'avg_confidence', 
        'avg_processing_time', 'total_merge_requests', 'successful_merge_requests',
        'usage_by_day', 'top_ticket_types'
    ]
    
    missing_fields = [field for field in required_fields if field not in analytics]
    if missing_fields:
        print(f"❌ Missing required fields in analytics response: {missing_fields}")
        return False
    
    print("✅ All required fields present in analytics response")
    
    # Verify no mock calculations
    print("\n🔍 Verifying no mock calculations are used...")
    
    total_suggestions = analytics['total_suggestions']
    
    # Check if successful_suggestions is NOT calculated as 85% of total
    mock_successful = round(total_suggestions * 0.85)
    if analytics['successful_suggestions'] == mock_successful and total_suggestions > 0:
        print(f"❌ successful_suggestions appears to be using mock 85% calculation: {analytics['successful_suggestions']} = {total_suggestions} * 0.85")
        return False
    
    # Check if total_merge_requests is NOT calculated as 60% of total
    mock_total_mr = round(total_suggestions * 0.6)
    if analytics['total_merge_requests'] == mock_total_mr and total_suggestions > 0:
        print(f"❌ total_merge_requests appears to be using mock 60% calculation: {analytics['total_merge_requests']} = {total_suggestions} * 0.6")
        return False
    
    # Check if successful_merge_requests is NOT calculated as 45% of total
    mock_successful_mr = round(total_suggestions * 0.45)
    if analytics['successful_merge_requests'] == mock_successful_mr and total_suggestions > 0:
        print(f"❌ successful_merge_requests appears to be using mock 45% calculation: {analytics['successful_merge_requests']} = {total_suggestions} * 0.45")
        return False
    
    print("✅ No mock calculations detected")
    
    # Verify merge requests are 0 (since they're not implemented)
    if analytics['total_merge_requests'] != 0:
        print(f"❌ total_merge_requests should be 0, got {analytics['total_merge_requests']}")
        return False
        
    if analytics['successful_merge_requests'] != 0:
        print(f"❌ successful_merge_requests should be 0, got {analytics['successful_merge_requests']}")
        return False
    
    print("✅ Merge request counts are correctly set to 0")
    
    # Verify data formats
    print("\n🔍 Verifying data formats...")
    
    # Check avg_confidence is in percentage form (0-100)
    if not (0 <= analytics['avg_confidence'] <= 100):
        print(f"❌ avg_confidence should be in range 0-100, got {analytics['avg_confidence']}")
        return False
    
    print(f"✅ avg_confidence is in correct percentage range: {analytics['avg_confidence']}%")
    
    # Check avg_processing_time is in seconds (not milliseconds)
    # Typical processing times should be under 60 seconds
    if not (0 <= analytics['avg_processing_time'] < 60):
        print(f"❌ avg_processing_time should be in seconds (0-60), got {analytics['avg_processing_time']}")
        return False
    
    print(f"✅ avg_processing_time is in correct seconds range: {analytics['avg_processing_time']}s")
    
    # Verify top_ticket_types format
    if not isinstance(analytics['top_ticket_types'], list):
        print(f"❌ top_ticket_types should be a list, got {type(analytics['top_ticket_types'])}")
        return False
    
    # If there are ticket types, verify their structure
    if analytics['top_ticket_types']:
        for ticket_type in analytics['top_ticket_types']:
            if not isinstance(ticket_type, dict) or 'type' not in ticket_type or 'count' not in ticket_type:
                print(f"❌ Invalid ticket type format: {ticket_type}")
                return False
        
        print(f"✅ top_ticket_types has valid format with {len(analytics['top_ticket_types'])} types")
    else:
        print("✅ top_ticket_types is empty (valid for no categorized tickets)")
    
    # Verify usage_by_day format
    if not isinstance(analytics['usage_by_day'], dict):
        print(f"❌ usage_by_day should be a dictionary, got {type(analytics['usage_by_day'])}")
        return False
    
    # If there is usage data, verify it has valid dates as keys
    if analytics['usage_by_day']:
        for date, count in analytics['usage_by_day'].items():
            # Check if date is in YYYY-MM-DD format
            try:
                datetime.strptime(date, '%Y-%m-%d')
            except ValueError:
                print(f"❌ Invalid date format in usage_by_day: {date}")
                return False
            
            if not isinstance(count, int) or count < 0:
                print(f"❌ Invalid count for date {date}: {count}")
                return False
        
        print(f"✅ usage_by_day has valid format with {len(analytics['usage_by_day'])} days")
    else:
        print("✅ usage_by_day is empty (valid for no usage data)")
    
    # Create a test suggestion to verify analytics updates
    print("\n🔍 Creating a test suggestion to verify analytics updates...")
    test_ticket_id = f"TEST-VERIFY-{int(time.time())}"
    
    suggestion_response = requests.post(
        f"{api_url}/suggest/code",
        json={"ticket_id": test_ticket_id}
    )
    
    if suggestion_response.status_code != 200:
        print(f"❌ Failed to create test suggestion: {suggestion_response.status_code}")
        return False
    
    suggestion = suggestion_response.json()
    print(f"✅ Created test suggestion with ID: {suggestion['id']}")
    print(f"   Confidence score: {suggestion['confidence_score']}")
    
    # Wait for database to update
    print("Waiting for database to update...")
    time.sleep(2)
    
    # Get updated analytics
    updated_response = requests.get(f"{api_url}/analytics")
    
    if updated_response.status_code != 200:
        print(f"❌ Failed to get updated analytics: {updated_response.status_code}")
        return False
    
    updated_analytics = updated_response.json()
    
    # Verify total_suggestions increased by 1
    if updated_analytics['total_suggestions'] != analytics['total_suggestions'] + 1:
        print(f"❌ total_suggestions should have increased by 1. Expected: {analytics['total_suggestions'] + 1}, got: {updated_analytics['total_suggestions']}")
        return False
    
    print(f"✅ total_suggestions correctly increased from {analytics['total_suggestions']} to {updated_analytics['total_suggestions']}")
    
    # Verify successful_suggestions increased if confidence > 0.5
    if suggestion['confidence_score'] > 0.5:
        if updated_analytics['successful_suggestions'] != analytics['successful_suggestions'] + 1:
            print(f"❌ successful_suggestions should have increased by 1. Expected: {analytics['successful_suggestions'] + 1}, got: {updated_analytics['successful_suggestions']}")
            return False
        
        print(f"✅ successful_suggestions correctly increased from {analytics['successful_suggestions']} to {updated_analytics['successful_suggestions']}")
    else:
        if updated_analytics['successful_suggestions'] != analytics['successful_suggestions']:
            print(f"❌ successful_suggestions should not have changed. Expected: {analytics['successful_suggestions']}, got: {updated_analytics['successful_suggestions']}")
            return False
        
        print(f"✅ successful_suggestions correctly remained at {updated_analytics['successful_suggestions']} (confidence ≤ 0.5)")
    
    # Verify merge request counts still 0
    if updated_analytics['total_merge_requests'] != 0 or updated_analytics['successful_merge_requests'] != 0:
        print(f"❌ Merge request counts should still be 0. Got: total={updated_analytics['total_merge_requests']}, successful={updated_analytics['successful_merge_requests']}")
        return False
    
    print("✅ Merge request counts correctly remained at 0")
    
    # Final summary
    print("\n" + "="*80)
    print("✅ ANALYTICS ENDPOINT VERIFICATION PASSED")
    print("="*80)
    print("\nThe analytics endpoint is correctly returning real data from the database:")
    print(f"- total_suggestions: {updated_analytics['total_suggestions']} (real count from database)")
    print(f"- successful_suggestions: {updated_analytics['successful_suggestions']} (real count of suggestions with confidence > 0.5)")
    print(f"- avg_confidence: {updated_analytics['avg_confidence']}% (real average, converted to percentage)")
    print(f"- avg_processing_time: {updated_analytics['avg_processing_time']}s (real average, converted to seconds)")
    print(f"- total_merge_requests: {updated_analytics['total_merge_requests']} (correctly set to 0)")
    print(f"- successful_merge_requests: {updated_analytics['successful_merge_requests']} (correctly set to 0)")
    print(f"- top_ticket_types: {len(updated_analytics['top_ticket_types'])} types (based on real ticket summaries)")
    print(f"- usage_by_day: {len(updated_analytics['usage_by_day'])} days of data (real usage data)")
    print("\nNo mock calculations were detected.")
    
    return True

if __name__ == "__main__":
    test_analytics_endpoint()
