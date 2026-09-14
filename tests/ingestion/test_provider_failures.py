from pipelines.cloud_providers import retry_with_backoff, GroqVerificationProvider

def test_retry_with_backoff_on_transient_429():
    attempts = 0

    def faulty_api():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise RuntimeError("429 Resource Exhausted: Rate limit exceeded")
        return {"status": "success", "result": "recovered"}

    res = retry_with_backoff(faulty_api, max_retries=3, initial_delay=0.01)
    assert res == {"status": "success", "result": "recovered"}
    assert attempts == 3


def test_fail_fast_on_invalid_api_key():
    attempts = 0

    def auth_error_api():
        nonlocal attempts
        attempts += 1
        raise RuntimeError("401 Invalid API Key provided")

    res = retry_with_backoff(auth_error_api, max_retries=3, initial_delay=0.01)
    assert res is None
    assert attempts == 1  # Should fail immediately without retrying indefinitely
