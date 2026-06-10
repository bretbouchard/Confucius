"""
Confucius Integration for Cross-Project Learning

Provides integration layer for Confucius scope management and pattern storage.
Respects Confucius scope boundaries and uses existing MCP tools.
"""

import hashlib
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

from lib.pattern_extractor import format_for_confucius

logger = logging.getLogger(__name__)


def get_repository_patterns() -> List[Dict[str, Any]]:
    """
    Get all patterns stored in repository scope.

    Returns:
        List of repository-scope patterns

    Repository scope patterns are shared across all projects
    and available for cross-project learning.

    Example:
        >>> patterns = get_repository_patterns()
        >>> for p in patterns:
        ...     print(f"{p['pattern_id']}: {p['domain']}")
    """
    # This would use Confucius MCP memory_retrieve with scope="repository"
    # For now, we'll read from the shared patterns directory
    shared_dir = Path.home() / ".claude" / ".planning" / "shared-patterns" / "exported"

    if not shared_dir.exists():
        return []

    patterns = []
    for pattern_file in shared_dir.glob("*.json"):
        with open(pattern_file) as f:
            pattern = json.load(f)
            patterns.append(pattern)

    return patterns


def store_repository_pattern(pattern: Dict[str, Any]) -> bool:
    """
    Store pattern in repository scope for sharing.

    Args:
        pattern: Pattern dictionary to store

    Returns:
        True if stored successfully

    Repository scope enables cross-project access.
    Pattern must be validated before storage.

    Example:
        >>> pattern = {
        ...     "pattern_id": "pat-20260324-001",
        ...     "content": "Use sliding window for rate limiting",
        ...     "domain": "api",
        ...     "confidence": 0.9
        ... }
        >>> store_repository_pattern(pattern)
        True
    """
    # Validate pattern structure
    if not _validate_pattern_structure(pattern):
        return False

    # This would use Confucius MCP memory_store with scope="repository"
    # For now, we'll store in the shared patterns directory
    shared_dir = Path.home() / ".claude" / ".planning" / "shared-patterns" / "exported"
    shared_dir.mkdir(parents=True, exist_ok=True)

    pattern_file = shared_dir / f"{pattern['pattern_id']}.json"
    with open(pattern_file, 'w') as f:
        json.dump(pattern, f, indent=2)

    return True


def query_relevant_patterns(domain: str) -> List[Dict[str, Any]]:
    """
    Query patterns by domain from repository scope.

    Args:
        domain: Domain to query (e.g., 'security', 'api', 'testing')

    Returns:
        List of patterns matching the domain

    Example:
        >>> patterns = query_relevant_patterns("security")
        >>> for p in patterns:
        ...     print(f"{p['pattern_id']}: {p['content'][:50]}")
    """
    # This would use Confucius MCP memory_retrieve with query and scope
    # For now, we'll filter repository patterns by domain
    all_patterns = get_repository_patterns()

    # Filter by domain
    relevant = []
    for pattern in all_patterns:
        if domain.lower() in pattern.get("domain", "").lower():
            relevant.append(pattern)

    return relevant


def get_scope_mapping() -> Dict[str, str]:
    """
    Get mapping of Confucius scopes to their purposes.

    Returns:
        Dictionary mapping scope names to descriptions

    Scope mapping:
    - repository: Cross-project sharing
    - submodule: Project-specific patterns
    - session: Current session patterns
    - task: Task-specific patterns
    """
    return {
        "global": "Universal - patterns available across ALL projects and sessions",
        "repository": "Cross-project sharing - patterns available to all projects",
        "submodule": "Project-specific - patterns for this project only",
        "session": "Session-scoped - patterns for current work session",
        "task": "Task-scoped - patterns for specific task"
    }


def determine_pattern_scope(pattern: Dict[str, Any], context: Optional[Dict] = None) -> str:
    """
    Determine appropriate scope for a pattern.

    Args:
        pattern: Pattern to scope
        context: Additional context for scoping decision

    Returns:
        Scope string (global, repository, submodule, session, or task)

    Scoping rules:
    - global: Universal patterns applicable across all projects (e.g., workflow, methodology, cross-domain)
    - repository: General patterns applicable across projects
    - submodule: Patterns specific to this project
    - session: Patterns for current work session
    - task: Patterns for specific task
    """
    # Check if pattern has explicit scope
    if "scope" in pattern:
        return pattern["scope"]

    # Infer from domain
    domain = pattern.get("domain", "").lower()

    # General domains suggest repository scope
    general_domains = {
        "python", "javascript", "typescript", "testing", "git",
        "docker", "security", "api", "database", "general"
    }

    if domain in general_domains:
        return "repository"

    # Check context for session/task scoping
    if context:
        if context.get("session_only"):
            return "session"
        if context.get("task_specific"):
            return "task"

    # Default to repository for reusable patterns
    return "repository"


# Helper functions

def _validate_pattern_structure(pattern: Dict[str, Any]) -> bool:
    """
    Validate pattern has required structure.

    Checks:
    - Has pattern_id
    - Has content
    - Has domain
    - Content is not empty
    - No PII (basic check)
    """
    required_fields = ["pattern_id", "content", "domain"]

    for field in required_fields:
        if field not in pattern:
            return False
        if not pattern[field]:
            return False

    # Basic PII check
    content = pattern.get("content", "")
    pii_indicators = ["password", "secret", "api_key", "token", "credential"]

    for indicator in pii_indicators:
        if indicator in content.lower():
            # Potential PII - reject
            return False

    return True


def _sanitize_domain(domain: str) -> str:
    """
    Sanitize domain string for storage.

    Args:
        domain: Domain string to sanitize

    Returns:
        Sanitized domain string

    Sanitization:
    - Lowercase
    - Remove special characters
    - Limit length
    """
    # Lowercase
    domain = domain.lower()

    # Remove special characters (keep alphanumeric, hyphen, underscore)
    sanitized = "".join(c for c in domain if c.isalnum() or c in "-_")

    # Limit length
    return sanitized[:50]


def _validate_source_project(source_project: str) -> bool:
    """
    Validate source project is trusted.

    Args:
        source_project: Path to source project

    Returns:
        True if project is trusted

    Trust validation:
    - Project exists
    - Project has valid structure
    - Project is not blacklisted
    """
    project_path = Path(source_project)

    # Check exists
    if not project_path.exists():
        return False

    # Check has valid structure
    if not (project_path / ".planning").exists():
        return False

    # Check not blacklisted
    blacklist_file = Path.home() / ".claude" / ".planning" / "shared-patterns" / "blacklist.txt"
    if blacklist_file.exists():
        with open(blacklist_file) as f:
            blacklist = [line.strip() for line in f if line.strip()]
        if source_project in blacklist:
            return False

    return True


def store_remember_pattern(
    content: str,
    tags: Optional[List[str]] = None,
    confidence: float = 1.0,
) -> bool:
    """
    Convenience wrapper for "remember this" commands.

    Builds a pattern dict from simple content/tags parameters and persists
    it via store_repository_pattern with repository scope and maximum
    confidence (user-initiated = maximum trust).

    Args:
        content: Pattern content to store. Must not be empty.
        tags: Optional list of categorisation tags.
        confidence: Confidence score (0.0-1.0). Defaults to 1.0.

    Returns:
        True if storage succeeded, False on validation failure or error.

    The generated pattern uses:
    - pattern_id: derived from content hash + timestamp
    - domain: "auto-remembered"
    - scope: "repository" (always)
    - confidence: 1.0 (user-initiated)
    """
    _logger = logging.getLogger(__name__)

    if not content or not content.strip():
        _logger.warning("store_remember_pattern: empty content, skipping")
        return False

    content_hash = hashlib.sha256(content.encode()).hexdigest()[:8]
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    pattern_id = f"remember-{content_hash}-{timestamp}"

    pattern = {
        "pattern_id": pattern_id,
        "content": content.strip(),
        "domain": "auto-remembered",
        "scope": "repository",
        "tags": tags or ["general"],
        "confidence": confidence,
        "stored_at": datetime.utcnow().isoformat() + "Z",
    }

    result = store_repository_pattern(pattern)
    if result:
        _logger.info(
            "store_remember_pattern: stored %s with tags=%s",
            pattern_id,
            tags,
        )
    else:
        _logger.warning(
            "store_remember_pattern: validation or storage failed for %s",
            pattern_id,
        )
    return result
