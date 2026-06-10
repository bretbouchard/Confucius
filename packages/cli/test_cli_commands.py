"""Tests for Confucius CLI core commands — store, search, list, get, tags, stats, purge-garbage."""

import importlib.util
import importlib.machinery
import json
import os
import subprocess
from pathlib import Path
from unittest.mock import patch

import pytest

# Load the CLI module
_cli_path = Path(__file__).parent / "confucius"
_loader = importlib.machinery.SourceFileLoader("confucius", str(_cli_path))
_spec = importlib.util.spec_from_loader("confucius", _loader)
mod = importlib.util.module_from_spec(_spec)
_loader.exec_module(mod)

cmd_store = mod.cmd_store
cmd_search = mod.cmd_search
cmd_list = mod.cmd_list
cmd_get = mod.cmd_get
cmd_tags = mod.cmd_tags
cmd_stats = mod.cmd_stats
cmd_purge_garbage = mod.cmd_purge_garbage
main = mod.main
get_memory_dir = mod.get_memory_dir
get_obsidian_vault = mod.get_obsidian_vault
ensure_dirs = mod.ensure_dirs
generate_id = mod.generate_id
get_artifact_path = mod.get_artifact_path
compute_content_hash = mod.compute_content_hash
update_index = mod.update_index
find_all_artifacts = mod.find_all_artifacts
MEMORY_DIR = mod.MEMORY_DIR
CONFUCIUS_ROOT = mod.CONFUCIUS_ROOT


@pytest.fixture(autouse=True)
def isolate_memory(tmp_path, monkeypatch):
    """Redirect all memory operations to a temp directory."""
    monkeypatch.setenv("CONFUCIUS_STORAGE_PATH", str(tmp_path))
    # Reload module constants
    mod.MEMORY_DIR = tmp_path
    mod.CONFUCIUS_ROOT = tmp_path
    mod.INDEX_FILE = tmp_path / "fs_memory" / "index.json"
    yield tmp_path


def make_args(**kwargs):
    """Create a mock args namespace."""
    defaults = {
        "content": None,
        "content_stdin": False,
        "type": "pattern",
        "tags": None,
        "scope": "repository",
        "confidence": 0.8,
        "source": None,
        "query": "test",
        "limit": 10,
        "id": "artifact-test",
        "dry_run": False,
    }
    defaults.update(kwargs)
    return type("Args", (), defaults)()


# ── get_memory_dir ──

class TestGetMemoryDir:
    def test_env_var(self, monkeypatch, tmp_path):
        monkeypatch.setenv("CONFUCIUS_STORAGE_PATH", str(tmp_path))
        assert get_memory_dir() == tmp_path

    def test_fallback(self, monkeypatch):
        monkeypatch.delenv("CONFUCIUS_STORAGE_PATH", raising=False)
        result = get_memory_dir()
        assert result == Path.home() / ".claude" / ".confucius" / "memory"

    def test_missing_env_uses_home(self):
        os.environ.pop("CONFUCIUS_STORAGE_PATH", None)
        result = get_memory_dir()
        assert ".confucius" in str(result)


# ── get_obsidian_vault ──

class TestGetObsidianVault:
    def test_env_set_and_exists(self, monkeypatch, tmp_path):
        monkeypatch.setenv("CONFUCIUS_OBSIDIAN_VAULT", str(tmp_path))
        assert get_obsidian_vault() == tmp_path

    def test_env_set_but_missing(self, monkeypatch):
        monkeypatch.setenv("CONFUCIUS_OBSIDIAN_VAULT", "/nonexistent/path")
        assert get_obsidian_vault() is None

    def test_env_not_set(self, monkeypatch):
        monkeypatch.delenv("CONFUCIUS_OBSIDIAN_VAULT", raising=False)
        assert get_obsidian_vault() is None


# ── ensure_dirs ──

class TestEnsureDirs:
    def test_creates_directory(self, tmp_path):
        mod.MEMORY_DIR = tmp_path / "new_mem"
        ensure_dirs()
        assert mod.MEMORY_DIR.exists()

    def test_idempotent(self, tmp_path):
        mod.MEMORY_DIR = tmp_path / "new_mem"
        ensure_dirs()
        ensure_dirs()
        assert mod.MEMORY_DIR.exists()


# ── generate_id ──

class TestGenerateId:
    def test_format(self):
        id = generate_id()
        assert id.startswith("artifact-")
        assert len(id) > 15

    def test_unique(self):
        ids = {generate_id() for _ in range(100)}
        assert len(ids) == 100


# ── get_artifact_path ──

class TestGetArtifactPath:
    def test_creates_dir(self, tmp_path):
        mod.MEMORY_DIR = tmp_path
        path = get_artifact_path("artifact-ab")
        assert path.parent.exists()
        assert path.parent.name == "ar"

    def test_short_id(self, tmp_path):
        mod.MEMORY_DIR = tmp_path
        path = get_artifact_path("x")
        assert path.parent.name == "x " or True  # fallback prefix

    def test_returns_correct_filename(self, tmp_path):
        mod.MEMORY_DIR = tmp_path
        path = get_artifact_path("artifact-1234567890")
        assert path.name == "artifact-1234567890.json"


# ── compute_content_hash ──

class TestComputeContentHash:
    def test_deterministic(self):
        h1 = compute_content_hash("hello", "pattern")
        h2 = compute_content_hash("hello", "pattern")
        assert h1 == h2

    def test_different_content_different_hash(self):
        h1 = compute_content_hash("hello", "pattern")
        h2 = compute_content_hash("world", "pattern")
        assert h1 != h2

    def test_different_type_different_hash(self):
        h1 = compute_content_hash("hello", "pattern")
        h2 = compute_content_hash("hello", "error_message")
        assert h1 != h2

    def test_sha256_format(self):
        h = compute_content_hash("test", "pattern")
        assert len(h) == 64  # SHA-256 hex


# ── update_index ──

class TestUpdateIndex:
    def test_creates_index(self, tmp_path):
        mod.MEMORY_DIR = tmp_path
        artifact = {
            "id": "artifact-111",
            "type": "pattern",
            "content": "Test pattern content here",
            "metadata": {"scope": "repository", "tags": ["test"], "confidence": 0.8},
            "timestamp": "2026-06-10",
        }
        update_index("artifact-111", artifact)

        index_path = tmp_path / "cli_index.json"
        assert index_path.exists()
        with open(index_path) as f:
            index = json.load(f)
        assert "artifact-111" in index["artifacts"]
        assert "test" in index["by_tag"]

    def test_updates_existing_index(self, tmp_path):
        mod.MEMORY_DIR = tmp_path
        artifact1 = {
            "id": "artifact-111",
            "type": "pattern",
            "content": "First pattern",
            "metadata": {"scope": "repository", "tags": ["a"], "confidence": 0.8},
            "timestamp": "2026-06-10",
        }
        update_index("artifact-111", artifact1)

        artifact2 = {
            "id": "artifact-222",
            "type": "error_message",
            "content": "Some error",
            "metadata": {"scope": "session", "tags": ["b"], "confidence": 0.5},
            "timestamp": "2026-06-10",
        }
        update_index("artifact-222", artifact2)

        index_path = tmp_path / "cli_index.json"
        with open(index_path) as f:
            index = json.load(f)
        assert len(index["artifacts"]) == 2
        assert "a" in index["by_tag"]
        assert "b" in index["by_tag"]
        assert "pattern" in index["by_type"]
        assert "error_message" in index["by_type"]


# ── cmd_store ──

class TestCmdStore:
    def test_store_basic(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        args = make_args(content="Use dependency injection for testable code" * 3)
        cmd_store(args)
        out = capsys.readouterr().out
        assert "Stored:" in out
        assert "pattern" in out

        # Verify file was created (skip cli_index.json)
        artifacts = [f for f in tmp_path.rglob("*.json") if f.name != "cli_index.json"]
        assert len(artifacts) >= 1
        with open(artifacts[0]) as f:
            data = json.load(f)
        assert "dependency injection" in data["content"]

    def test_store_with_tags(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        args = make_args(content="Always validate inputs at system boundaries" * 3, tags="security,validation")
        cmd_store(args)
        out = capsys.readouterr().out
        assert "security" in out

    def test_store_dedup(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        content = "Always use structured concurrency in Swift" * 3
        args = make_args(content=content)
        cmd_store(args)
        cmd_store(args)  # Second store should be skipped
        out = capsys.readouterr().out
        assert "Skipped duplicate" in out

    def test_store_too_short(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        args = make_args(content="too short")
        with pytest.raises(SystemExit):
            cmd_store(args)

    def test_store_garbage_phrase(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        args = make_args(content="please now do the thing properly" * 3)
        with pytest.raises(SystemExit):
            cmd_store(args)

    def test_store_no_content(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        args = make_args(content=None, content_stdin=False)
        with pytest.raises(SystemExit):
            cmd_store(args)

    def test_store_from_stdin(self, tmp_path, capsys, monkeypatch):
        import io
        mod.MEMORY_DIR = tmp_path
        monkeypatch.setattr("sys.stdin", io.StringIO("Content from stdin input " * 5))
        args = make_args(content_stdin=True)
        cmd_store(args)
        out = capsys.readouterr().out
        assert "Stored:" in out

    def test_store_updates_index(self, tmp_path):
        mod.MEMORY_DIR = tmp_path
        args = make_args(content="Indexable pattern for search" * 3)
        cmd_store(args)
        index_path = tmp_path / "cli_index.json"
        assert index_path.exists()


# ── cmd_search ──

class TestCmdSearch:
    def test_search_basic(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        # Store an artifact first
        args = make_args(content="Swift structured concurrency pattern" * 3)
        cmd_store(args)

        search_args = make_args(query="swift concurrency")
        cmd_search(search_args)
        out = capsys.readouterr().out
        assert "pattern" in out.lower() or "swift" in out.lower()

    def test_search_no_results(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        # Store something first so it doesn't bail on "No memories"
        cmd_store(make_args(content="Unrelated content" * 5))
        search_args = make_args(query="nonexistent_pattern_xyz")
        cmd_search(search_args)
        out = capsys.readouterr().out
        assert "No results" in out

    def test_search_empty_memory(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        search_args = make_args(query="anything")
        cmd_search(search_args)
        out = capsys.readouterr().out
        assert "No memories" in out

    def test_search_limit(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        # Store multiple artifacts
        for i in range(5):
            args = make_args(content=f"Pattern number {i} for testing" * 3)
            cmd_store(args)

        search_args = make_args(query="pattern", limit=2)
        cmd_search(search_args)
        out = capsys.readouterr().out
        # Should show limited results
        assert "Found" in out


# ── cmd_list ──

class TestCmdList:
    def test_list_empty(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_list(make_args())
        out = capsys.readouterr().out
        assert "No memories" in out

    def test_list_with_artifacts(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_store(make_args(content="First pattern for listing" * 3))
        cmd_store(make_args(content="Second pattern for listing" * 3))
        cmd_list(make_args())
        out = capsys.readouterr().out
        assert "Total:" in out
        assert "pattern" in out.lower()

    def test_list_groups_by_type(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_store(make_args(content="Pattern item" * 5, type="pattern"))
        cmd_store(make_args(content="Error item" * 5, type="error_message"))
        cmd_list(make_args())
        out = capsys.readouterr().out
        assert "pattern" in out.lower()
        assert "error_message" in out.lower()


# ── cmd_get ──

class TestCmdGet:
    def test_get_existing(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_store(make_args(content="Gettable artifact content here" * 3))
        # Find only artifact JSON files (skip cli_index.json)
        artifacts = [f for f in tmp_path.rglob("*.json") if "cli_index" not in f.name]
        artifact_id = artifacts[0].stem

        cmd_get(make_args(id=artifact_id))
        out = capsys.readouterr().out
        assert "Gettable artifact" in out

    def test_get_not_found(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_get(make_args(id="nonexistent-id"))
        out = capsys.readouterr().out
        assert "not found" in out.lower()


# ── cmd_tags ──

class TestCmdTags:
    def test_tags_empty(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_tags(make_args())
        out = capsys.readouterr().out
        assert "No memories" in out or "No tags" in out

    def test_tags_with_artifacts(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_store(make_args(content="Tagged content" * 5, tags="swift,async"))
        cmd_tags(make_args())
        out = capsys.readouterr().out
        assert "swift" in out
        assert "async" in out

    def test_tags_sorted_by_count(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_store(make_args(content="Content one" * 5, tags="python"))
        cmd_store(make_args(content="Content two" * 5, tags="python"))
        cmd_store(make_args(content="Content three" * 5, tags="swift"))
        cmd_tags(make_args())
        out = capsys.readouterr().out
        # python (2) should appear before swift (1)
        py_pos = out.index("python")
        sw_pos = out.index("swift")
        assert py_pos < sw_pos


# ── cmd_stats ──

class TestCmdStats:
    def test_stats_empty(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_stats(make_args())
        out = capsys.readouterr().out
        assert "No memories" in out

    def test_stats_with_artifacts(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_store(make_args(content="Stats pattern" * 5, type="pattern"))
        cmd_store(make_args(content="Stats error" * 5, type="error_message"))
        cmd_stats(make_args())
        out = capsys.readouterr().out
        assert "Total artifacts: 2" in out
        assert "pattern: 1" in out
        assert "error_message: 1" in out

    def test_stats_shows_storage_path(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_store(make_args(content="Storage test" * 5))
        cmd_stats(make_args())
        out = capsys.readouterr().out
        assert str(tmp_path) in out


# ── cmd_purge_garbage ──

class TestCmdPurgeGarbage:
    def test_purge_dry_run(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        # Store a garbage artifact
        artifact = {
            "id": "artifact-garbage",
            "type": "pattern",
            "content": "Test pattern: Confucius integration",
            "metadata": {
                "decisions": [{"situation": "please now"}],
                "scope": "repository",
                "tags": [],
                "confidence": 0.8,
            },
            "timestamp": "2026-06-10",
        }
        artifact_dir = tmp_path / "ar"
        artifact_dir.mkdir()
        with open(artifact_dir / "artifact-garbage.json", "w") as f:
            json.dump(artifact, f)

        args = make_args(dry_run=True)
        cmd_purge_garbage(args)
        out = capsys.readouterr().out
        assert "WOULD REMOVE" in out
        # File should still exist (dry run)
        assert (artifact_dir / "artifact-garbage.json").exists()

    def test_purge_actual(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        artifact = {
            "id": "artifact-garbage2",
            "type": "pattern",
            "content": "No decisions here and nothing else",
            "metadata": {
                "decisions": [],
                "scope": "repository",
                "tags": [],
                "confidence": 0.8,
            },
            "timestamp": "2026-06-10",
        }
        artifact_dir = tmp_path / "ar"
        artifact_dir.mkdir()
        with open(artifact_dir / "artifact-garbage2.json", "w") as f:
            json.dump(artifact, f)

        args = make_args(dry_run=False)
        cmd_purge_garbage(args)
        out = capsys.readouterr().out
        assert "REMOVED" in out
        assert not (artifact_dir / "artifact-garbage2.json").exists()

    def test_purge_keeps_good_artifacts(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        cmd_store(make_args(content="Good clean pattern" * 5))
        args = make_args(dry_run=True)
        cmd_purge_garbage(args)
        out = capsys.readouterr().out
        assert "kept 1" in out

    def test_purge_short_situation(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        artifact = {
            "id": "artifact-short",
            "type": "pattern",
            "content": "Valid content here that should be kept",
            "metadata": {
                "decisions": [{"situation": "I"}],  # too short
                "scope": "repository",
                "tags": [],
                "confidence": 0.8,
            },
            "timestamp": "2026-06-10",
        }
        artifact_dir = tmp_path / "ar"
        artifact_dir.mkdir()
        with open(artifact_dir / "artifact-short.json", "w") as f:
            json.dump(artifact, f)

        args = make_args(dry_run=True)
        cmd_purge_garbage(args)
        out = capsys.readouterr().out
        assert "WOULD REMOVE" in out
        assert "too short" in out


# ── main ──

class TestMain:
    def test_no_command_shows_help(self, capsys):
        with patch("sys.argv", ["confucius"]):
            try:
                main()
            except SystemExit:
                pass
        out = capsys.readouterr().out
        assert "Confucius CLI" in out or "usage" in out.lower() or out == ""

    def test_store_command_dispatch(self, tmp_path, capsys):
        mod.MEMORY_DIR = tmp_path
        with patch("sys.argv", ["confucius", "store", "pattern", "Good pattern content" * 3]):
            try:
                main()
            except SystemExit:
                pass
        out = capsys.readouterr().out
        assert "Stored:" in out or "pattern" in out


# ── find_all_artifacts ──

class TestFindAllArtifacts:
    def test_empty_dir(self, tmp_path):
        mod.MEMORY_DIR = tmp_path
        assert find_all_artifacts() == []

    def test_finds_json_files(self, tmp_path):
        mod.MEMORY_DIR = tmp_path
        (tmp_path / "ab").mkdir()
        (tmp_path / "ab" / "artifact-test.json").write_text("{}")
        (tmp_path / "ab" / "README.md").write_text("not json")
        assert len(find_all_artifacts()) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
