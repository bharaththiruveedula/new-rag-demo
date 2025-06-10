
import requests
import json
import time
from datetime import datetime
import random

class AnalyticsEndpointTester:
    def __init__(self, base_url="https://c624a4bd-9719-44d8-8b44-e52e7972801c.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{self.base_url}/api"
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

    def get_analytics(self):
        """Get analytics data from the API"""
        success, response = self.run_test(
            "Get Analytics Data",
            "GET",
            "analytics",
            200
        )
        if success:
            return response.json()
        return None

    def create_test_suggestion(self, confidence_score=0.7):
        """Create a test suggestion with specified confidence score"""
        test_ticket_id = f"TEST-{int(time.time())}-{random.randint(1000, 9999)}"
        
        # First, we need to create a suggestion
        success, response = self.run_test(
            f"Create Test Suggestion (confidence: {confidence_score})",
            "POST",
            "suggest/code",
            200,
            data={"ticket_id": test_ticket_id}
        )
        
        if not success:
            print("❌ Failed to create test suggestion")
            return None
            
        # The API doesn't allow setting confidence directly, so we'll just return the created suggestion
        return response.json()

    def verify_analytics_data_types(self, analytics):
        """Verify that analytics data has the correct types"""
        print("\n🔍 Verifying analytics data types...")
        
        # Check required fields
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
        
        # Verify data types
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
        
        all_types_correct = True
        for value, expected_type, field_name in type_checks:
            if not isinstance(value, expected_type):
                print(f"❌ {field_name} should be {expected_type.__name__}, got {type(value).__name__}")
                all_types_correct = False
        
        if all_types_correct:
            print("✅ All data types are correct in analytics response")
            return True
        return False

    def verify_no_mock_calculations(self, analytics, total_suggestions):
        """Verify that no mock calculations are used"""
        print("\n🔍 Verifying no mock calculations are used...")
        
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
        
        # Verify merge requests are 0 (since they're not implemented)
        if analytics['total_merge_requests'] != 0:
            print(f"❌ total_merge_requests should be 0, got {analytics['total_merge_requests']}")
            return False
            
        if analytics['successful_merge_requests'] != 0:
            print(f"❌ successful_merge_requests should be 0, got {analytics['successful_merge_requests']}")
            return False
        
        print("✅ No mock calculations detected")
        return True

    def verify_analytics_values(self, analytics, expected_total, expected_successful):
        """Verify that analytics values are calculated correctly"""
        print("\n🔍 Verifying analytics values...")
        
        # Check total_suggestions
        if analytics['total_suggestions'] != expected_total:
            print(f"❌ total_suggestions should be {expected_total}, got {analytics['total_suggestions']}")
            return False
        
        print(f"✅ total_suggestions is correct: {analytics['total_suggestions']}")
        
        # Check successful_suggestions
        if analytics['successful_suggestions'] != expected_successful:
            print(f"❌ successful_suggestions should be {expected_successful}, got {analytics['successful_suggestions']}")
            return False
        
        print(f"✅ successful_suggestions is correct: {analytics['successful_suggestions']}")
        
        # Check avg_confidence is in percentage form (0-100)
        if not (0 <= analytics['avg_confidence'] <= 100):
            print(f"❌ avg_confidence should be in range 0-100, got {analytics['avg_confidence']}")
            return False
        
        print(f"✅ avg_confidence is in correct range: {analytics['avg_confidence']}%")
        
        # Check avg_processing_time is in seconds (not milliseconds)
        # Typical processing times should be under 60 seconds
        if not (0 <= analytics['avg_processing_time'] < 60):
            print(f"❌ avg_processing_time should be in seconds (0-60), got {analytics['avg_processing_time']}")
            return False
        
        print(f"✅ avg_processing_time is in correct range: {analytics['avg_processing_time']}s")
        
        return True

    def run_analytics_tests(self):
        """Run comprehensive tests on the analytics endpoint"""
        print("\n" + "="*50)
        print("🧪 ANALYTICS ENDPOINT TESTING")
        print("="*50)
        
        # Get initial analytics
        initial_analytics = self.get_analytics()
        if not initial_analytics:
            print("❌ Failed to get initial analytics")
            return False
        
        print("\n📊 Initial Analytics Data:")
        print(f"Total Suggestions: {initial_analytics['total_suggestions']}")
        print(f"Successful Suggestions: {initial_analytics['successful_suggestions']}")
        print(f"Avg Confidence: {initial_analytics['avg_confidence']}%")
        print(f"Avg Processing Time: {initial_analytics['avg_processing_time']}s")
        print(f"Total Merge Requests: {initial_analytics['total_merge_requests']}")
        print(f"Successful Merge Requests: {initial_analytics['successful_merge_requests']}")
        print(f"Usage by Day: {json.dumps(initial_analytics['usage_by_day'], indent=2)}")
        print(f"Top Ticket Types: {json.dumps(initial_analytics['top_ticket_types'], indent=2)}")
        
        # Verify data types
        if not self.verify_analytics_data_types(initial_analytics):
            return False
        
        # Verify no mock calculations
        if not self.verify_no_mock_calculations(initial_analytics, initial_analytics['total_suggestions']):
            return False
        
        # Create test suggestions with different confidence scores
        initial_total = initial_analytics['total_suggestions']
        initial_successful = initial_analytics['successful_suggestions']
        
        # Create suggestions with confidence > 0.5 (should count as successful)
        high_confidence_suggestions = []
        for _ in range(2):
            suggestion = self.create_test_suggestion(confidence_score=0.7)
            if suggestion:
                high_confidence_suggestions.append(suggestion)
                print(f"Created suggestion with confidence: {suggestion['confidence_score']}")
        
        # Create suggestions with confidence <= 0.5 (should not count as successful)
        low_confidence_suggestions = []
        for _ in range(1):
            suggestion = self.create_test_suggestion(confidence_score=0.3)
            if suggestion:
                low_confidence_suggestions.append(suggestion)
                print(f"Created suggestion with confidence: {suggestion['confidence_score']}")
        
        # Wait for database to update
        print("\nWaiting for database to update...")
        time.sleep(2)
        
        # Get updated analytics
        updated_analytics = self.get_analytics()
        if not updated_analytics:
            print("❌ Failed to get updated analytics")
            return False
        
        print("\n📊 Updated Analytics Data:")
        print(f"Total Suggestions: {updated_analytics['total_suggestions']}")
        print(f"Successful Suggestions: {updated_analytics['successful_suggestions']}")
        print(f"Avg Confidence: {updated_analytics['avg_confidence']}%")
        print(f"Avg Processing Time: {updated_analytics['avg_processing_time']}s")
        print(f"Total Merge Requests: {updated_analytics['total_merge_requests']}")
        print(f"Successful Merge Requests: {updated_analytics['successful_merge_requests']}")
        
        # Calculate expected values
        expected_total = initial_total + len(high_confidence_suggestions) + len(low_confidence_suggestions)
        
        # Count successful suggestions (confidence > 0.5)
        high_confidence_count = sum(1 for s in high_confidence_suggestions if s['confidence_score'] > 0.5)
        expected_successful = initial_successful + high_confidence_count
        
        # Verify updated analytics values
        if not self.verify_analytics_values(updated_analytics, expected_total, expected_successful):
            return False
        
        # Verify no mock calculations in updated analytics
        if not self.verify_no_mock_calculations(updated_analytics, updated_analytics['total_suggestions']):
            return False
        
        print("\n" + "="*50)
        print("✅ ANALYTICS ENDPOINT TESTS PASSED")
        print("="*50)
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*50)
        
        for i, result in enumerate(self.test_results):
            status_icon = "✅" if result["status"] == "PASS" else "❌"
            print(f"{i+1}. {status_icon} {result['name']} - {result['status']}")
        
        print("="*50)
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")

def main():
    tester = AnalyticsEndpointTester()
    tester.run_analytics_tests()
    tester.print_summary()

if __name__ == "__main__":
    main()
