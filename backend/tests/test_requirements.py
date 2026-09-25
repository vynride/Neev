import unittest
from types import SimpleNamespace

from pydantic import ValidationError

from app.routers.requirements import RequirementIn
from app.services.requirements import select_requirement_hits


class RequirementSelectionTests(unittest.TestCase):
    def test_published_requirement_outranks_draft_and_unrelated_text(self):
        rows = [
            SimpleNamespace(
                id="r1",
                status="published",
                title="Invoice timing",
                body="Invoices are due in 30 days",
                version=2,
            ),
            SimpleNamespace(
                id="r2",
                status="draft",
                title="Invoice timing",
                body="Invoices are due today",
                version=0,
            ),
            SimpleNamespace(
                id="r3", status="published", title="Logo", body="Use the blue logo", version=1
            ),
        ]

        hits = select_requirement_hits(rows, "when is the invoice due")

        self.assertEqual([hit.id for hit in hits], ["r1"])

    def test_empty_query_does_not_dump_all_requirements(self):
        rows = [
            SimpleNamespace(id="r1", status="published", title="Budget", body="1000", version=1)
        ]

        self.assertEqual(select_requirement_hits(rows, ""), [])

    def test_whitespace_only_requirement_cannot_be_saved(self):
        with self.assertRaises(ValidationError):
            RequirementIn(title="   ", body="A real requirement")


if __name__ == "__main__":
    unittest.main()
