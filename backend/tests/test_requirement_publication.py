import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.services.requirements import prepare_embedding


class RequirementPublicationTests(unittest.IsolatedAsyncioTestCase):
    async def test_embedding_failure_blocks_publication_when_configured(self):
        fake_llm = SimpleNamespace(embed=AsyncMock(side_effect=RuntimeError("provider failed")))
        with (
            patch(
                "app.services.requirements.get_settings",
                return_value=SimpleNamespace(openai_api_key="key"),
            ),
            patch("app.services.requirements.get_llm", return_value=fake_llm),
        ):
            with self.assertRaises(RuntimeError):
                await prepare_embedding("Invoice due in 30 days")

    async def test_keyword_only_mode_needs_no_embedding_provider(self):
        with patch(
            "app.services.requirements.get_settings",
            return_value=SimpleNamespace(openai_api_key=""),
        ):
            self.assertIsNone(await prepare_embedding("Invoice due in 30 days"))


if __name__ == "__main__":
    unittest.main()
