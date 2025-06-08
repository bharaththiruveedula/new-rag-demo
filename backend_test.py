
import requests
import json
import time
from datetime import datetime

class RAGCodeSuggestionAPITester:
    def __init__(self, base_url="https://860488f2-f040-4baf-a319-6a888ae71c12.preview.emergentagent.com"):
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
            print(f"Configuration retrieved: {json.dumps(response.json(), indent=2)}")
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
            print(f"File Path: {suggestion['file_path']}")
            print(f"Explanation: {suggestion['explanation']}")
            print(f"Suggested Code: {suggestion['suggested_code'][:100]}...")
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

def main():
    tester = RAGCodeSuggestionAPITester()
    
    # Test configuration endpoints
    tester.test_get_config()
    
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
    
    # Test connection status endpoints
    tester.test_check_all_connections()
    
    # Test individual service connections
    for service in ["ollama", "gitlab", "jira", "postgres"]:
        tester.test_check_service_connection(service)
    
    # Test vectorization endpoints
    tester.test_vectorize_repository()
    tester.test_get_vectorization_status()
    
    # Test code suggestion endpoints
    test_ticket_id = "TEST-123"
    tester.test_suggest_code(test_ticket_id)
    
    # Test merge request creation
    tester.test_create_merge_request(test_ticket_id)
    
    # Print summary
    tester.print_summary()

if __name__ == "__main__":
    main()
