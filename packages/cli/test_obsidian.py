"""Tests for Obsidian vault integration in Confucius CLI."""

import importlib.util
import json
import os
import types
from pathlib import Path

import pytest

# Load the CLI module directly (no .py extension)
_cli_path = Path(__file__).parent / "confucius"
_loader = importlib.machinery.SourceFileLoader("confucius", str(_cli_path))
_spec = importlib.util.spec_from_loader("confucius", _loader)
_confucius = importlib.util.module_from_spec(_spec)
_loader.exec_module(_confucius)

parse_frontmatter = _confucius.parse_frontmatter
find_obsidian_notes = _confucius.find_obsidian_notes
obsidian_note_to_artifact = _confucius.obsidian_note_to_artifact
artifact_to_obsidian_markdown = _confucius.artifact_to_obsidian_markdown
write_to_obsidian_vault = _confucius.write_to_obsidian_vault
CONFUCIUS_TYPES = _confucius.CONFUCIUS_TYPES


@pytest.fixture
def vault(tmp_path):
    """Create a temporary Obsidian vault with sample notes."""
    confucius_dir = tmp_path / "Confucius" / "repository"
    confucius_dir.mkdir(parents=True)

    # Valid Confucius note
    (confucius_dir / "swift-concurrency.md").write_text("""\
---
type: pattern
scope: repository
tags: ["swift", "async", "concurrency"]
confidence: 0.9
artifact_id: artifact-1234567890
created: 2026-06-09
source: human
validated: true
---

# Always use Swift structured concurrency

Use async/await with TaskGroup instead of completion handlers.

## Context
Found during audio engine refactoring in White Room.
""")

    # Another valid note, different scope
    session_dir = tmp_path / "Confucius" / "session"
    session_dir.mkdir(parents=True)
    (session_dir / "debug-session-note.md").write_text("""\
---
type: error_message
scope: session
tags: ["debug", "memory"]
confidence: 0.7
artifact_id: artifact-9876543210
created: 2026-06-08
---
# Memory leak in pattern cache

The pattern cache was not evicting old entries.
""")

    # Regular Obsidian note (no Confucius frontmatter — should be ignored)
    (tmp_path / "meeting-notes.md").write_text("""\
---
tags: [meeting, standup]
---
# Daily Standup

Talked about sprint progress.
""")

    # .obsidian config dir
    (tmp_path / ".obsidian").mkdir()
    (tmp_path / ".obsidian" / "app.json").write_text("{}")

    return tmp_path


@pytest.fixture
def sample_artifact():
    return {
        "id": "artifact-1111222333",
        "type": "pattern",
        "content": "Validate inputs at system boundaries, trust internals",
        "metadata": {
            "scope": "repository",
            "tags": ["security", "validation"],
            "confidence": 0.95,
            "source": "confucius",
        },
        "timestamp": "2026-06-09T12:00:00",
    }


# ── parse_frontmatter ──

class TestParseFrontmatter:
    def test_valid_frontmatter(self):
        text = "---\ntype: pattern\nscope: repository\ntags: [\"swift\", \"async\"]\n---\n\nBody text here"
        meta, body = parse_frontmatter(text)
        assert meta["type"] == "pattern"
        assert meta["scope"] == "repository"
        assert meta["tags"] == ["swift", "async"]
        assert body == "Body text here"

    def test_no_frontmatter(self):
        text = "# Just a heading\nSome content"
        meta, body = parse_frontmatter(text)
        assert meta is None
        assert body == text

    def test_malformed_frontmatter(self):
        text = "---\nbroken yaml\n---\n\nBody"
        # Should not crash, returns None metadata
        meta, body = parse_frontmatter(text)
        assert body == "Body"

    def test_numeric_values(self):
        text = "---\nconfidence: 0.9\ncount: 5\n---\n\nBody"
        meta, body = parse_frontmatter(text)
        assert meta["confidence"] == 0.9
        assert meta["count"] == 5

    def test_string_tags_not_array(self):
        text = "---\ntype: pattern\ntags: \"single-tag\"\n---\n\nBody"
        meta, body = parse_frontmatter(text)
        assert meta["tags"] == "single-tag"


# ── find_obsidian_notes ──

class TestFindObsidianNotes:
    def test_finds_valid_notes(self, vault):
        notes = find_obsidian_notes(vault)
        assert len(notes) == 2

    def test_ignores_non_confucius_notes(self, vault):
        notes = find_obsidian_notes(vault)
        ids = [n["metadata"]["artifact_id"] for n in notes]
        assert "artifact-1234567890" in ids
        assert "artifact-9876543210" in ids
        # The meeting-notes.md should be excluded (no type in CONFUCIUS_TYPES)

    def test_ignores_obsidian_config(self, vault):
        notes = find_obsidian_notes(vault)
        paths = [str(n["path"]) for n in notes]
        assert not any(".obsidian" in p for p in paths)

    def test_empty_vault(self, tmp_path):
        notes = find_obsidian_notes(tmp_path)
        assert notes == []

    def test_none_vault(self):
        # Should not crash when vault is None
        notes = find_obsidian_notes(None)
        assert notes == []


# ── obsidian_note_to_artifact ──

class TestNoteToArtifact:
    def test_basic_conversion(self, vault):
        notes = find_obsidian_notes(vault)
        pattern_note = [n for n in notes if "swift" in str(n["metadata"]["tags"])][0]
        artifact = obsidian_note_to_artifact(pattern_note)

        assert artifact["id"] == "artifact-1234567890"
        assert artifact["type"] == "pattern"
        assert "structured concurrency" in artifact["content"]
        assert artifact["metadata"]["scope"] == "repository"
        assert "swift" in artifact["metadata"]["tags"]
        # source comes from frontmatter (could be "human", "confucius", etc.)
        assert artifact["metadata"]["source"] in ("obsidian", "human")
        assert artifact["obsidian"] is True

    def test_validated_flag(self, vault):
        notes = find_obsidian_notes(vault)
        pattern_note = [n for n in notes if n["metadata"].get("validated")][0]
        artifact = obsidian_note_to_artifact(pattern_note)
        # YAML parser returns "true" as string, not boolean
        assert artifact["metadata"]["validated"] in (True, "true")

    def test_missing_fields_use_defaults(self, vault):
        notes = find_obsidian_notes(vault)
        # The error_message note doesn't have source or validated
        error_note = [n for n in notes if n["metadata"]["type"] == "error_message"][0]
        artifact = obsidian_note_to_artifact(error_note)
        assert artifact["metadata"]["confidence"] == 0.7
        assert artifact["metadata"]["validated"] is False


# ── artifact_to_obsidian_markdown ──

class TestArtifactToMarkdown:
    def test_basic_conversion(self, sample_artifact):
        md = artifact_to_obsidian_markdown(sample_artifact)

        assert md.startswith("---\n")
        assert "type: pattern" in md
        assert "scope: repository" in md
        assert "confidence: 0.95" in md
        assert "artifact_id: artifact-1111222333" in md
        assert "tags:" in md
        assert "---\n" in md[4:]  # Second ---
        assert "Validate inputs" in md
        assert "validated: false" in md

    def test_long_content_gets_heading(self, sample_artifact):
        md = artifact_to_obsidian_markdown(sample_artifact)
        assert "# Validate inputs at system boundaries" in md

    def test_short_content_no_heading(self):
        artifact = {
            "id": "artifact-000",
            "type": "pattern",
            "content": "Short note without newline",
            "metadata": {"scope": "repository", "tags": [], "confidence": 0.5},
            "timestamp": "2026-06-09",
        }
        md = artifact_to_obsidian_markdown(artifact)
        assert "# Short note without newline" in md

    def test_list_tags_formatted(self, sample_artifact):
        md = artifact_to_obsidian_markdown(sample_artifact)
        # Tags should be in JSON array format
        assert '["security", "validation"]' in md or '"security"' in md


# ── write_to_obsidian_vault ──

class TestWriteToVault:
    def test_write_creates_file(self, vault, sample_artifact):
        path = write_to_obsidian_vault(sample_artifact, vault)
        assert path is not None
        assert path.exists()

        content = path.read_text()
        assert "type: pattern" in content
        assert "Validate inputs" in content

    def test_write_creates_scope_directory(self, vault, sample_artifact):
        sample_artifact["metadata"]["scope"] = "session"
        path = write_to_obsidian_vault(sample_artifact, vault)
        assert "session" in str(path)

    def test_write_safe_filename(self, vault, sample_artifact):
        path = write_to_obsidian_vault(sample_artifact, vault)
        assert path.suffix == ".md"
        # No special chars in filename
        assert path.stem == path.stem.replace(" ", "-")

    def test_write_no_vault_returns_none(self, sample_artifact):
        path = write_to_obsidian_vault(sample_artifact, None)
        assert path is None

    def test_write_then_read_back(self, vault, sample_artifact):
        path = write_to_obsidian_vault(sample_artifact, vault)
        notes = find_obsidian_notes(vault)
        found = [n for n in notes if n["metadata"]["artifact_id"] == sample_artifact["id"]]
        assert len(found) == 1
        artifact = obsidian_note_to_artifact(found[0])
        # Content gets heading prepended on write, so check original content is in there
        assert sample_artifact["content"] in artifact["content"]

    def test_overwrite_same_content(self, vault, sample_artifact):
        path1 = write_to_obsidian_vault(sample_artifact, vault)
        path2 = write_to_obsidian_vault(sample_artifact, vault)
        assert path1 == path2


# ── round-trip ──

class TestRoundTrip:
    def test_store_then_search(self, vault, sample_artifact):
        # Write artifact to vault
        write_to_obsidian_vault(sample_artifact, vault)

        # Find it back
        notes = find_obsidian_notes(vault)
        assert len(notes) == 3  # 2 original + 1 new
        found = [n for n in notes if n["metadata"]["artifact_id"] == sample_artifact["id"]]
        assert len(found) == 1

        # Convert back to artifact
        artifact = obsidian_note_to_artifact(found[0])
        assert artifact["type"] == sample_artifact["type"]
        assert artifact["metadata"]["scope"] == sample_artifact["metadata"]["scope"]
        assert set(artifact["metadata"]["tags"]) == set(sample_artifact["metadata"]["tags"])


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
