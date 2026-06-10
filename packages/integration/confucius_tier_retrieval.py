"""Tier-aware retrieval for Confucius memory artifacts.

Retrieves artifacts across hot/cold/archive tiers, returning tier-appropriate
data: full content for hot/cold, metadata-only for archive.

Usage:
    from lib.confucius_tier_retrieval import retrieve_artifacts
    results = retrieve_artifacts("my query")
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from lib.memory_lifecycle import _normalize_tags, _walk_artifacts, read_artifact

logger = logging.getLogger(__name__)

# Security: max query length (H-03 sec)
MAX_QUERY_LENGTH = 500


def format_retrieval_result(artifact: dict, file_path: Path) -> dict:
    """Format an artifact for retrieval output with tier indicator (F-14).

    Determines tier from file extension (.json.gz -> cold) and artifact
    content (tier == "archive" -> archive, else hot). Returns dict with
    all artifact fields plus tier indicator.

    For archive tier: includes _note field explaining content is unavailable.
    For artifacts with missing metadata.tags: treats as empty list (F-19).

    Args:
        artifact: Parsed artifact dict from read_artifact.
        file_path: Path to the artifact file on disk.

    Returns:
        Dict with artifact fields plus tier indicator.
    """
    file_path = Path(file_path)
    suffixes = "".join(file_path.suffixes)

    # Determine tier from file extension and artifact content
    if suffixes.endswith(".gz"):
        tier = "cold"
    elif artifact.get("tier") == "archive":
        tier = "archive"
    else:
        tier = "hot"

    # Build result with all artifact fields
    result = dict(artifact)
    result["tier"] = tier

    # Normalize missing tags to empty list (F-19)
    metadata = result.get("metadata", {})
    if "tags" not in metadata or metadata["tags"] is None:
        result["metadata"] = dict(metadata)
        result["metadata"]["tags"] = []

    # Archive tier: metadata-only with note (F-13)
    if tier == "archive":
        result.pop("content", None)
        result["_note"] = "Archived — content removed. Metadata available for search."

    return result


def retrieve_artifacts(
    query: str,
    memory_root: Optional[Path] = None,
    config: Optional[dict] = None,
    limit: int = 20,
) -> list[dict]:
    """Retrieve artifacts with tier-aware formatting.

    Walks memory_root, filters by query using case-insensitive substring
    matching, formats results based on tier.

    Query validation (H-03 sec):
        - Max 500 chars
        - Reject non-printable characters
        - Empty query returns empty list (F-15)

    Args:
        query: Search string for case-insensitive substring matching.
        memory_root: Root directory of the memory store. Defaults to
            ~/.confucius/memory/.
        config: Config dict (unused currently, reserved for future).
        limit: Maximum number of results to return.

    Returns:
        List of formatted artifact dicts sorted by confidence (desc) then
        timestamp (newest first).
    """
    # Query validation (H-03 sec)
    if not query:
        return []  # F-15: empty query returns empty

    if len(query) > MAX_QUERY_LENGTH:
        logger.warning("Query rejected: exceeds max length %d (got %d)", MAX_QUERY_LENGTH, len(query))
        return []  # H-03 sec: query too long

    if not query.isprintable():
        logger.warning("Query rejected: contains non-printable characters")
        return []  # H-03 sec: non-printable characters

    if memory_root is None:
        memory_root = Path.home() / ".confucius" / "memory"

    memory_root = Path(memory_root)

    # Walk all artifacts
    all_entries = _walk_artifacts(memory_root)

    query_lower = query.lower()
    results = []

    for entry in all_entries:
        artifact = entry["artifact"]
        file_path = entry["path"]

        # Match against searchable fields using case-insensitive substring
        searchable_fields = [
            artifact.get("id", ""),
            artifact.get("type", ""),
            artifact.get("content", ""),
            artifact.get("summary", ""),
        ]

        # Add tags (normalized)
        metadata = artifact.get("metadata", {})
        tags = _normalize_tags(metadata)
        tag_string = " ".join(str(t) for t in tags)
        searchable_fields.append(tag_string)

        # Add scope
        scope = metadata.get("scope", "")
        searchable_fields.append(scope)

        # Check if query matches any field (F-16: case-insensitive)
        matched = False
        for field in searchable_fields:
            if query_lower in field.lower():
                matched = True
                break

        if not matched:
            continue

        # Format result based on tier
        formatted = format_retrieval_result(artifact, file_path)
        results.append(formatted)

    # Sort by confidence (descending), then timestamp (newest first)
    def _sort_key(item: dict) -> tuple:
        confidence = item.get("metadata", {}).get("confidence", 0.0)
        if confidence is None:
            confidence = 0.0
        ts_str = item.get("timestamp", "")
        try:
            ts = datetime.fromisoformat(ts_str)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            ts = datetime.min.replace(tzinfo=timezone.utc)
        # Negate confidence for descending, negate epoch for newest-first
        return (-confidence, -int(ts.timestamp()))

    results.sort(key=_sort_key)

    # Apply limit
    return results[:limit]
