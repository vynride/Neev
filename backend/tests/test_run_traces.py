import unittest
from dataclasses import dataclass
from datetime import date

from app.services.run_traces import RunTrace, current_run, record_event, storage_safe, use_run


class RunTraceTests(unittest.TestCase):
    def test_events_keep_full_content_and_are_isolated_by_run(self):
        first = RunTrace(project_id="p1", actor_id="s1", question="full question")
        second = RunTrace(project_id="p2", actor_id="s2", question="other question")

        with use_run(first):
            record_event("gen_ai.chat", input={"secret": "unredacted"}, output={"answer": "full"})
            with use_run(second):
                record_event("tool.call", input={"query": "other"})
            record_event("answer.ready", output={"answer": "first"})

        self.assertIsNone(current_run())
        self.assertEqual([event["name"] for event in first.events], ["gen_ai.chat", "answer.ready"])
        self.assertEqual(first.events[0]["input"]["secret"], "unredacted")
        self.assertEqual(len(second.events), 1)
        self.assertNotEqual(first.trace_id, second.trace_id)

    def test_tool_call_objects_are_storage_safe(self):
        @dataclass
        class Call:
            id: str
            arguments: dict

        run = RunTrace(project_id="p", actor_id="s", question="q")
        with use_run(run):
            record_event("gen_ai.chat", input={"messages": [{"tool_calls": [Call("x", {"a": 1})]}]})

        self.assertEqual(
            run.events[0]["input"]["messages"][0]["tool_calls"],
            [{"id": "x", "arguments": {"a": 1}}],
        )

    def test_date_in_requirement_audit_payload_is_storage_safe(self):
        self.assertEqual(
            storage_safe({"effective_date": date(2026, 9, 24)}), {"effective_date": "2026-09-24"}
        )

    def test_run_metadata_does_not_embed_unbounded_events(self):
        run = RunTrace(project_id="p", actor_id="s", question="q")
        with use_run(run):
            record_event("tool.call", output="large result")

        document = run.document()

        self.assertNotIn("events", document)
        self.assertEqual(document["event_count"], 1)


if __name__ == "__main__":
    unittest.main()
