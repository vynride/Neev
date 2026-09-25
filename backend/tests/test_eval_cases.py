import unittest

from pydantic import ValidationError

from app.routers.evals import CaseIn


class EvalCaseValidationTests(unittest.TestCase):
    def test_blank_assertions_cannot_create_vacuous_case(self):
        with self.assertRaises(ValidationError):
            CaseIn(expected_refs=["   "], forbidden_text=[""], required_text=[])


if __name__ == "__main__":
    unittest.main()
