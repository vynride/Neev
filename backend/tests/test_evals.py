import unittest
from types import SimpleNamespace

from app.evals.runner import evaluate_reply


class EvaluationTests(unittest.TestCase):
    def test_missing_required_requirement_citation_blocks_release(self):
        case = {"expected_refs": ["req:billing:v2"], "forbidden_text": []}
        reply = SimpleNamespace(message="Invoices are due tomorrow", citations=[])

        result = evaluate_reply(case, reply)

        self.assertFalse(result["passed"])
        self.assertIn("unsupported_requirement", result["critical_failures"])

    def test_forbidden_project_content_blocks_release(self):
        case = {"expected_refs": [], "forbidden_text": ["Project Orion"]}
        reply = SimpleNamespace(message="See Project Orion", citations=[])

        result = evaluate_reply(case, reply)

        self.assertFalse(result["passed"])
        self.assertIn("cross_project_disclosure", result["critical_failures"])

    def test_missing_expected_answer_fact_fails_regression_case(self):
        case = {"expected_refs": [], "forbidden_text": [], "required_text": ["30 days"]}
        reply = SimpleNamespace(message="Payment is due tomorrow", citations=[])

        result = evaluate_reply(case, reply)

        self.assertFalse(result["passed"])
        self.assertIn("answer_regression", result["critical_failures"])


if __name__ == "__main__":
    unittest.main()
