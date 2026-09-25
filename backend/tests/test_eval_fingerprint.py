import unittest

from app.evals.fingerprint import make_fingerprint


class FingerprintTests(unittest.TestCase):
    def test_requirement_or_prompt_change_makes_prior_eval_stale(self):
        base = make_fingerprint(
            models={"strong": "m1"}, prompt="p1", sources=[("req:r1:v1", "old")]
        )
        changed_source = make_fingerprint(
            models={"strong": "m1"}, prompt="p1", sources=[("req:r1:v2", "new")]
        )
        changed_prompt = make_fingerprint(
            models={"strong": "m1"}, prompt="p2", sources=[("req:r1:v1", "old")]
        )

        self.assertNotEqual(base, changed_source)
        self.assertNotEqual(base, changed_prompt)


if __name__ == "__main__":
    unittest.main()
