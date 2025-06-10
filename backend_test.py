
import requests
import json
import time
from datetime import datetime

class RAGCodeSuggestionAPITester:
    def __init__(self, base_url="https://c624a4bd-9719-44d8-8b44-e52e7972801c.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            start_time = time.time()
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
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

    def test_get_config(self):
        """Test getting the current configuration"""
        success, response = self.run_test(
            "Get Configuration",
            "GET",
            "config",
            200
        )
        if success:
            config = response.json()
            print(f"Configuration retrieved: {json.dumps(config, indent=2)}")
            
            # Check if OLLAMA configuration is present
            if 'ollama_url' in config and 'ollama_model' in config:
                print(f"✅ OLLAMA configuration found - URL: {config['ollama_url']}, Model: {config['ollama_model']}")
            else:
                print("❌ OLLAMA configuration missing")
        return success
        
    def test_update_config(self, config_update):
        """Test updating the configuration"""
        success, response = self.run_test(
            "Update Configuration",
            "POST",
            "config",
            200,
            data=config_update
        )
        if success:
            print(f"Configuration updated: {json.dumps(response.json(), indent=2)}")
            
            # If OLLAMA URL was updated, check if it was properly saved
            if 'ollama_url' in config_update:
                updated_config = response.json()
                if updated_config.get('ollama_url') == config_update['ollama_url']:
                    print(f"✅ OLLAMA URL successfully updated to: {updated_config['ollama_url']}")
                else:
                    print(f"❌ OLLAMA URL not updated correctly. Expected: {config_update['ollama_url']}, Got: {updated_config.get('ollama_url')}")
        return success

    def test_check_all_connections(self):
        """Test checking all service connections"""
        success, response = self.run_test(
            "Check All Connections",
            "GET",
            "status/all",
            200
        )
        if success:
            statuses = response.json()
            for status in statuses:
                print(f"Service: {status['service']} - Status: {status['status']} - Message: {status['message']}")
                
                # Check if OLLAMA models are included in the response
                if status['service'] == 'ollama' and status.get('details') and 'available_models' in status['details']:
                    models = status['details']['available_models']
                    print(f"OLLAMA models in 'status/all' response: {models}")
                    if models:
                        print(f"✅ 'status/all' endpoint includes OLLAMA models")
                    else:
                        print("⚠️ 'status/all' endpoint returned empty OLLAMA models list")
        return success

    def test_vectorize_repository(self):
        """Test starting repository vectorization"""
        success, response = self.run_test(
            "Start Repository Vectorization",
            "POST",
            "vectorize/repository",
            200
        )
        if success:
            print(f"Vectorization started: {json.dumps(response.json(), indent=2)}")
        return success

    def test_check_service_connection(self, service):
        """Test checking a specific service connection"""
        success, response = self.run_test(
            f"Check {service.capitalize()} Connection",
            "GET",
            f"status/{service}",
            200
        )
        if success:
            status = response.json()
            print(f"Service: {status['service']} - Status: {status['status']} - Message: {status['message']}")
            
            # For OLLAMA, check if models are returned
            if service == "ollama" and status.get('details') and 'available_models' in status['details']:
                models = status['details']['available_models']
                print(f"Available OLLAMA models: {models}")
                if models:
                    print(f"✅ Successfully fetched {len(models)} OLLAMA models")
                else:
                    print("⚠️ No OLLAMA models returned")
        return success

    def test_get_vectorization_status(self):
        """Test getting vectorization status"""
        success, response = self.run_test(
            "Get Vectorization Status",
            "GET",
            "vectorize/status",
            200
        )
        if success:
            status = response.json()
            print(f"Vectorization Status: {status['status']} - Total Files: {status['total_files']} - Processed: {status['processed_files']} - Failed: {status['failed_files']}")
        return success

    def test_suggest_code(self, ticket_id):
        """Test generating code suggestion"""
        success, response = self.run_test(
            "Generate Code Suggestion",
            "POST",
            "suggest/code",
            200,
            data={"ticket_id": ticket_id}
        )
        if success:
            suggestion = response.json()
            print(f"Code Suggestion for {suggestion['ticket_id']} - Confidence: {suggestion['confidence_score']}")
            if 'suggested_changes' in suggestion and suggestion['suggested_changes']:
                change = suggestion['suggested_changes'][0]
                print(f"File Path: {change.get('file_path', 'N/A')}")
                print(f"Change Type: {change.get('change_type', 'N/A')}")
                print(f"Content Preview: {change.get('content', '')[:100]}...")
            print(f"Explanation: {suggestion['explanation']}")
        return success

    def test_create_merge_request(self, ticket_id):
        """Test creating a merge request"""
        success, response = self.run_test(
            "Create Merge Request",
            "POST",
            "gitlab/merge-request",
            200,
            params={"ticket_id": ticket_id}
        )
        if success:
            result = response.json()
            print(f"Merge Request Created: {result['message']} - URL: {result['merge_request_url']}")
        return success

    def test_get_analytics(self):
        """Test getting system analytics and metrics"""
        success, response = self.run_test(
            "Get Analytics",
            "GET",
            "analytics",
            200
        )
        if success:
            analytics = response.json()
            print(f"Analytics - Total Suggestions: {analytics.get('total_suggestions')} - Avg Confidence: {analytics.get('avg_confidence')}%")
            print(f"Successful MRs: {analytics.get('successful_merge_requests')} - Avg Processing Time: {analytics.get('avg_processing_time')}s")
            
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
            if not isinstance(analytics['total_suggestions'], int):
                print(f"❌ total_suggestions should be an integer, got {type(analytics['total_suggestions'])}")
                return False
                
            if not isinstance(analytics['avg_confidence'], float):
                print(f"❌ avg_confidence should be a float, got {type(analytics['avg_confidence'])}")
                return False
                
            if not isinstance(analytics['avg_processing_time'], float):
                print(f"❌ avg_processing_time should be a float, got {type(analytics['avg_processing_time'])}")
                return False
                
            if not isinstance(analytics['usage_by_day'], dict):
                print(f"❌ usage_by_day should be a dictionary, got {type(analytics['usage_by_day'])}")
                return False
                
            if not isinstance(analytics['top_ticket_types'], list):
                print(f"❌ top_ticket_types should be a list, got {type(analytics['top_ticket_types'])}")
                return False
            
            print("✅ All data types are correct in analytics response")
            
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
            else:
                print(f"ℹ️ Database is not fresh, contains {analytics['total_suggestions']} suggestions")
                
                # Verify that avg_confidence is in percentage (0-100 range)
                if 0 <= analytics['avg_confidence'] <= 100:
                    print("✅ avg_confidence is in percentage range (0-100)")
                else:
                    print(f"❌ avg_confidence is not in percentage range: {analytics['avg_confidence']}")
                
                # Verify that avg_processing_time is in seconds (not milliseconds)
                # Typical processing times should be under 60 seconds
                if 0 <= analytics['avg_processing_time'] < 60:
                    print("✅ avg_processing_time appears to be in seconds")
                else:
                    print(f"❌ avg_processing_time may not be in seconds: {analytics['avg_processing_time']}")
        
        return success
        
    def test_analytics_after_suggestion(self):
        """Test analytics data after creating a code suggestion"""
        print("\n🔍 Testing analytics before and after creating a suggestion...")
        
        # First, get initial analytics
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
            
        # Verify that avg_confidence is calculated and in percentage form
        if updated_analytics['avg_confidence'] > 0:
            print(f"✅ avg_confidence is calculated: {updated_analytics['avg_confidence']}%")
            
            # Verify it's in percentage form (0-100 range)
            if 0 <= updated_analytics['avg_confidence'] <= 100:
                print("✅ avg_confidence is in percentage range (0-100)")
            else:
                print(f"❌ avg_confidence is not in percentage range: {updated_analytics['avg_confidence']}")
        
        # Verify that avg_processing_time is calculated and in seconds
        if updated_analytics['avg_processing_time'] > 0:
            print(f"✅ avg_processing_time is calculated: {updated_analytics['avg_processing_time']}s")
            
            # Verify it's in seconds (not milliseconds)
            # Typical processing times should be under 60 seconds
            if 0 <= updated_analytics['avg_processing_time'] < 60:
                print("✅ avg_processing_time appears to be in seconds")
            else:
                print(f"❌ avg_processing_time may not be in seconds: {updated_analytics['avg_processing_time']}")
        
        return success
        
    def test_search_code(self, query):
        """Test semantic code search"""
        success, response = self.run_test(
            "Search Code",
            "GET",
            f"search/code",
            200,
            params={"query": query}
        )
        if success:
            results = response.json()
            print(f"Search Results for '{query}' - Found {len(results.get('results', []))} matches")
            for i, result in enumerate(results.get('results', [])[:3]):  # Show first 3 results
                print(f"  {i+1}. {result.get('file_path')} - Similarity: {result.get('similarity'):.2f}")
        return success
        
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

    def test_ollama_model_fallback(self):
        """Test OLLAMA model fallback behavior with invalid URL"""
        # First update config with invalid OLLAMA URL
        invalid_config = {
            "ollama_url": "http://invalid-ollama-url:11434"
        }
        self.run_test(
            "Update Config with Invalid OLLAMA URL",
            "POST",
            "config",
            200,
            data=invalid_config
        )
        
        # Then check OLLAMA status to see fallback behavior
        success, response = self.run_test(
            "Check OLLAMA Fallback Behavior",
            "GET",
            "status/ollama",
            200
        )
        
        if success:
            status = response.json()
            print(f"OLLAMA Fallback Status: {status['status']} - Message: {status['message']}")
            
            # Check if status indicates error (which is expected)
            if status['status'] == 'error':
                print("✅ Correctly reported error status with invalid OLLAMA URL")
            else:
                print("⚠️ Unexpected status with invalid OLLAMA URL")
                
            # Even with error, the API should still return a valid response
            if 'service' in status and status['service'] == 'ollama':
                print("✅ API returned valid response structure despite error")
            else:
                print("❌ API response structure is invalid")
                
        return success

def main():
    tester = RAGCodeSuggestionAPITester()
    
    # Test configuration endpoints
    tester.test_get_config()
    
    # Test OLLAMA model fetching specifically
    print("\n🔍 Testing OLLAMA Model Fetching...")
    tester.test_check_service_connection("ollama")
    
    # Test updating configuration with test values
    test_config = {
        "ollama_url": "http://localhost:11434",
        "ollama_model": "codellama:7b",
        "gitlab_url": "https://gitlab.example.com",
        "gitlab_token": "test_token",
        "jira_url": "https://jira.example.com",
        "jira_username": "test_user",
        "jira_token": "test_token",
        "postgres_host": "localhost",
        "postgres_port": 5432,
        "postgres_db": "vector_db",
        "postgres_user": "postgres",
        "postgres_password": "test_password",
        "target_repository": "test/repo",
        "default_branch": "main"
    }
    tester.test_update_config(test_config)
    
    # Test OLLAMA model fetching after URL update
    print("\n🔍 Testing OLLAMA Model Fetching after URL update...")
    tester.test_check_service_connection("ollama")
    
    # Test OLLAMA fallback behavior with invalid URL
    print("\n🔍 Testing OLLAMA Fallback Behavior...")
    tester.test_ollama_model_fallback()
    
    # Test connection status endpoints
    tester.test_check_all_connections()
    
    # Test individual service connections
    for service in ["gitlab", "jira", "postgres"]:
        tester.test_check_service_connection(service)
    
    # Test vectorization endpoints
    tester.test_vectorize_repository()
    tester.test_get_vectorization_status()
    
    # Test code suggestion endpoints
    test_ticket_id = "TEST-123"
    tester.test_suggest_code(test_ticket_id)
    
    # Test merge request creation
    tester.test_create_merge_request(test_ticket_id)
    
    # Test analytics endpoint
    tester.test_get_analytics()
    
    # Test analytics after creating a suggestion
    tester.test_analytics_after_suggestion()
    
    # Test code search
    tester.test_search_code("ansible module")
    
    # Print summary
    tester.print_summary()

if __name__ == "__main__":
    main()
