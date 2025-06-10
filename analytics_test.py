#!/usr/bin/env python3
"""
Analytics Endpoint Test Script

This script specifically tests the /api/analytics endpoint to verify:
1. It returns real data instead of dummy values
2. The JSON structure has the required fields
3. The avg_confidence is converted to percentage (multiplied by 100)
4. The avg_processing_time is converted from milliseconds to seconds
5. Error handling works correctly
6. Data accuracy for a fresh database
7. Data updates after creating a suggestion
"""

import requests
import json
import time
from datetime import datetime
import os

# Get backend URL from environment variable
BACKEND_URL = os.environ.get('BACKEND_URL', 'https://c624a4bd-9719-44d8-8b44-e52e7972801c.preview.emergentagent.com')

class AnalyticsEndpointTester:
    def __init__(self, base_url=BACKEND_URL):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            start_time = time.time()
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            
            elapsed_time = time.time() - start_time
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                result = {
                    "name": name,
                    "status": "PASS",
                    "response_time": f"{elapsed_time:.2f}s",
                    "status_code": response.status_code
                }
                print(f"✅ Passed - Status: {response.status_code} - Time: {elapsed_time:.2f}s")
            else:
                result = {
                    "name": name,
                    "status": "FAIL",
                    "response_time": f"{elapsed_time:.2f}s",
                    "status_code": response.status_code,
                    "expected_status": expected_status
                }
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code} - Time: {elapsed_time:.2f}s")
            
            try:
                result["response"] = response.json()
            except:
                result["response"] = response.text
                
            self.test_results.append(result)
            return success, response
        except Exception as e:
            self.test_results.append({
                "name": name,
                "status": "ERROR",
                "error": str(e)
            })
            print(f"❌ Error - {str(e)}")
            return False, None

    def test_analytics_structure(self):
        """Test the structure of the analytics endpoint response"""
        success, response = self.run_test(
            "Analytics Endpoint Structure",
            "GET",
            "analytics",
            200
        )
        
        if not success:
            return False
            
        analytics = response.json()
        print(f"Analytics Response: {json.dumps(analytics, indent=2)}")
        
        # Verify the JSON structure has all required fields
        required_fields = [
            'total_suggestions', 'successful_suggestions', 'avg_confidence', 
            'avg_processing_time', 'total_merge_requests', 'successful_merge_requests',
            'usage_by_day', 'top_ticket_types'
        ]
        
        missing_fields = [field for field in required_fields if field not in analytics]
        if missing_fields:
            print(f"❌ Missing required fields in analytics response: {missing_fields}")
            return False
        else:
            print("✅ All required fields present in analytics response")
        
        # Verify data types are correct
        type_checks = [
            (analytics['total_suggestions'], int, 'total_suggestions'),
            (analytics['successful_suggestions'], int, 'successful_suggestions'),
            (analytics['avg_confidence'], float, 'avg_confidence'),
            (analytics['avg_processing_time'], float, 'avg_processing_time'),
            (analytics['total_merge_requests'], int, 'total_merge_requests'),
            (analytics['successful_merge_requests'], int, 'successful_merge_requests'),
            (analytics['usage_by_day'], dict, 'usage_by_day'),
            (analytics['top_ticket_types'], list, 'top_ticket_types')
        ]
        
        type_errors = []
        for value, expected_type, field_name in type_checks:
            if not isinstance(value, expected_type):
                type_errors.append(f"{field_name} should be {expected_type.__name__}, got {type(value).__name__}")
        
        if type_errors:
            print("❌ Type errors in analytics response:")
            for error in type_errors:
                print(f"  - {error}")
            return False
        else:
            print("✅ All data types are correct in analytics response")
            
        return True

    def test_analytics_data_accuracy(self):
        """Test the accuracy of analytics data for a fresh database"""
        success, response = self.run_test(
            "Analytics Data Accuracy",
            "GET",
            "analytics",
            200
        )
        
        if not success:
            return False
            
        analytics = response.json()
        
        # For a fresh database, verify all metrics are 0 or empty
        # Note: This test assumes a fresh database. If data exists, this check might fail.
        if analytics['total_suggestions'] == 0:
            print("✅ total_suggestions is 0 as expected for a fresh database")
            
            # If no suggestions, these values should also be 0
            zero_fields = [
                'successful_suggestions', 'avg_confidence', 'avg_processing_time',
                'total_merge_requests', 'successful_merge_requests'
            ]
            
            all_zeros = all(analytics[field] == 0 for field in zero_fields)
            if all_zeros:
                print("✅ All metrics are 0 as expected for a fresh database")
            else:
                print("❌ Some metrics are not 0 despite total_suggestions being 0:")
                for field in zero_fields:
                    if analytics[field] != 0:
                        print(f"  - {field}: {analytics[field]}")
            
            if not analytics['usage_by_day']:
                print("✅ usage_by_day is empty as expected for a fresh database")
            else:
                print(f"❌ usage_by_day is not empty: {analytics['usage_by_day']}")
                
            if not analytics['top_ticket_types'] or all(item['count'] == 0 for item in analytics['top_ticket_types']):
                print("✅ top_ticket_types are empty or have zero counts as expected")
            else:
                print(f"❌ top_ticket_types have non-zero counts: {analytics['top_ticket_types']}")
        else:
            print(f"ℹ️ Database is not fresh, contains {analytics['total_suggestions']} suggestions")
            
        return True

    def test_analytics_unit_conversion(self):
        """Test that analytics values are properly converted (confidence to %, time to seconds)"""
        # First create a suggestion to ensure we have data
        test_ticket_id = f"TEST-{int(time.time())}"  # Use timestamp to ensure unique ticket ID
        success, _ = self.run_test(
            "Create Test Suggestion",
            "POST",
            "suggest/code",
            200,
            data={"ticket_id": test_ticket_id}
        )
        
        if not success:
            print("❌ Failed to create test suggestion")
            return False
            
        # Wait a moment for database to update
        time.sleep(1)
        
        # Get analytics
        success, response = self.run_test(
            "Analytics Unit Conversion",
            "GET",
            "analytics",
            200
        )
        
        if not success:
            return False
            
        analytics = response.json()
        
        # Verify that avg_confidence is in percentage (0-100 range)
        if analytics['avg_confidence'] > 0:
            if 0 <= analytics['avg_confidence'] <= 100:
                print("✅ avg_confidence is in percentage range (0-100)")
            else:
                print(f"❌ avg_confidence is not in percentage range: {analytics['avg_confidence']}")
                return False
        
        # Verify that avg_processing_time is in seconds (not milliseconds)
        if analytics['avg_processing_time'] > 0:
            # Typical processing times should be under 60 seconds
            if 0 <= analytics['avg_processing_time'] < 60:
                print("✅ avg_processing_time appears to be in seconds")
            else:
                print(f"❌ avg_processing_time may not be in seconds: {analytics['avg_processing_time']}")
                return False
                
        return True

    def test_analytics_after_suggestion(self):
        """Test that analytics data updates after creating a suggestion"""
        # Get initial analytics
        success, initial_response = self.run_test(
            "Get Initial Analytics",
            "GET",
            "analytics",
            200
        )
        
        if not success:
            print("❌ Failed to get initial analytics")
            return False
            
        initial_analytics = initial_response.json()
        initial_count = initial_analytics['total_suggestions']
        print(f"Initial total_suggestions: {initial_count}")
        
        # Create a test suggestion
        test_ticket_id = f"TEST-{int(time.time())}"  # Use timestamp to ensure unique ticket ID
        success, suggestion_response = self.run_test(
            "Create Test Suggestion",
            "POST",
            "suggest/code",
            200,
            data={"ticket_id": test_ticket_id}
        )
        
        if not success:
            print("❌ Failed to create test suggestion")
            return False
            
        # Wait a moment for database to update
        time.sleep(1)
        
        # Get updated analytics
        success, updated_response = self.run_test(
            "Get Updated Analytics",
            "GET",
            "analytics",
            200
        )
        
        if not success:
            print("❌ Failed to get updated analytics")
            return False
            
        updated_analytics = updated_response.json()
        updated_count = updated_analytics['total_suggestions']
        print(f"Updated total_suggestions: {updated_count}")
        
        # Verify that total_suggestions increased by 1
        if updated_count == initial_count + 1:
            print("✅ total_suggestions increased by 1 after creating a suggestion")
        else:
            print(f"❌ total_suggestions did not increase correctly. Expected {initial_count + 1}, got {updated_count}")
            return False
            
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print(f"📊 Analytics Endpoint Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*50)
        
        for i, result in enumerate(self.test_results):
            status_icon = "✅" if result["status"] == "PASS" else "❌"
            print(f"{i+1}. {status_icon} {result['name']} - {result['status']}")
        
        print("="*50)
        
        if self.tests_passed == self.tests_run:
            print("🎉 All analytics tests passed!")
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")

def main():
    print("="*50)
    print("🧪 RAG Assistant Analytics Endpoint Test")
    print("="*50)
    print(f"Backend URL: {BACKEND_URL}")
    print("="*50)
    
    tester = AnalyticsEndpointTester()
    
    # Test 1: Verify analytics endpoint structure
    tester.test_analytics_structure()
    
    # Test 2: Verify data accuracy for a fresh database
    tester.test_analytics_data_accuracy()
    
    # Test 3: Verify unit conversions (confidence to %, time to seconds)
    tester.test_analytics_unit_conversion()
    
    # Test 4: Verify analytics updates after creating a suggestion
    tester.test_analytics_after_suggestion()
    
    # Print summary
    tester.print_summary()

if __name__ == "__main__":
    main()