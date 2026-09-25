import unittest

from app.agent.mentor import guard_requirement_answer


class GroundingTests(unittest.TestCase):
    def test_uncited_requirement_answer_is_not_presented_as_fact(self):
        data = {
            "next_action": "answered",
            "message": "The deadline is Friday.",
            "draft_client_message": None,
        }

        guarded = guard_requirement_answer(
            "requirements_communication", "project_specific", data, []
        )

        self.assertEqual(guarded["next_action"], "ask_client")
        self.assertNotIn("Friday", guarded["message"])
        self.assertTrue(guarded["draft_client_message"])

    def test_cited_requirement_answer_is_preserved(self):
        data = {"next_action": "answered", "message": "The deadline is Friday."}

        guarded = guard_requirement_answer(
            "requirements_communication", "project_specific", data, [{"ref": "req:r1:v1"}]
        )

        self.assertEqual(guarded, data)


if __name__ == "__main__":
    unittest.main()
