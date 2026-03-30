"""
RAG-lite Knowledge Retrieval Service — Phase 5.

Uses simple keyword + category matching to retrieve relevant SOPs
and procedural guidance from the local knowledge base.

In a production system this would be backed by a vector store (Chroma/Pinecone).
For this demo it provides the same semantic experience using deterministic scoring.
"""

from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Optional

KB_FILE = Path(__file__).parent.parent / "data" / "knowledge_base.json"

_cache: list[dict] | None = None


def _load() -> list[dict]:
    global _cache
    if _cache is None:
        _cache = json.loads(KB_FILE.read_text(encoding="utf-8"))
    return _cache


def _tokenise(text: str) -> set[str]:
    return set(re.sub(r"[^\w\s]", "", text.lower()).split())


def score_article(
    article: dict,
    query_tokens: set[str],
    category: Optional[str],
    priority: Optional[str],
) -> float:
    score = 0.0

    # ── Category match ────────────────────────────────────────────────────────
    if category and category in article.get("categories", []):
        score += 5.0

    # ── Priority relevance ────────────────────────────────────────────────────
    if priority and priority in article.get("priority_relevance", []):
        score += 2.0

    # ── Tag overlap ───────────────────────────────────────────────────────────
    article_tags = {t.lower() for t in article.get("tags", [])}
    tag_overlap = sum(1 for qt in query_tokens if any(qt in tag for tag in article_tags))
    score += tag_overlap * 1.5

    # ── Full-text keyword overlap ─────────────────────────────────────────────
    content_tokens = _tokenise(article.get("content", "") + " " + article.get("title", ""))
    text_overlap = len(query_tokens & content_tokens)
    score += text_overlap * 0.3

    return score


def retrieve(
    query: str,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    top_k: int = 3,
) -> list[dict]:
    """
    Retrieve the top_k most relevant knowledge-base articles for the given
    query + category + priority context.

    Returns list of dicts with keys: id, title, sop_ref, content,
    resolution_time, relevance_score.
    """
    articles = _load()
    query_tokens = _tokenise(query)

    scored = [
        (article, score_article(article, query_tokens, category, priority))
        for article in articles
    ]
    scored.sort(key=lambda x: x[1], reverse=True)

    results = []
    for article, score in scored[:top_k]:
        if score > 0:
            results.append({
                "id":               article["id"],
                "title":            article["title"],
                "sop_ref":          article["sop_ref"],
                "content":          article["content"],
                "resolution_time":  article["resolution_time"],
                "categories":       article["categories"],
                "relevance_score":  round(score, 2),
            })

    return results


def retrieve_for_request(request: object) -> list[dict]:
    """Convenience wrapper — accepts an IssueRequest-like object."""
    text = " ".join(filter(None, [
        getattr(request, "title", None),
        getattr(request, "description", None),
        getattr(request, "transcript", None),
    ]))
    return retrieve(
        query=text,
        category=getattr(request, "aiCategory", None) or getattr(request, "category", None),
        priority=getattr(request, "aiPriority", None) or getattr(request, "priority", None),
    )
