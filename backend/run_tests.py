import traceback

def normalize_indentation(code):
    """Converts tabs to spaces in code for consistent indentation."""
    return "\n".join(line.replace("\t", "    ") for line in code.splitlines())


def run_tests(submitted_code, public_tests, private_tests):
    results = []
    all_tests_passed = True

    try:
        # Define the local scope in which to run the code
        local_scope = {}
        submitted_code = normalize_indentation(submitted_code)
        imports = "from typing import List, Dict, Tuple\n"
        submitted_code = imports + submitted_code

        # Execute the user's submitted code
        exec(submitted_code, {}, local_scope)

        # Run each public test case
        for idx, test in enumerate(public_tests):
            try:
                exec(test, {}, local_scope)
                results.append(f"✔️ Public test {idx + 1} passed.")
            except AssertionError:
                # Return specific public test that failed
                results.append(f"❌ Public test {idx + 1} failed: {test}.")
                all_tests_passed = False
            except Exception:
                results.append(f"❌ Public test {idx + 1} failed: {test} with error {traceback.format_exc()}")
                all_tests_passed = False

        # Run private tests if all public tests passed
        if all_tests_passed:
            for test in private_tests:
                try:
                    exec(test, {}, local_scope)
                    results.append(f"✔️ Private test {idx + 1} passed.")
                except AssertionError:
                    results.append(f"❌ Private test {idx + 1} failed.")
                    all_tests_passed = False
                except Exception as e:
                    results.append(f"❌ Private test {idx + 1} failed.")
                    all_tests_passed = False

        # All tests passed
        return all_tests_passed, results

    except Exception as e:
        return False, f"Code execution error: {traceback.format_exc()}"
