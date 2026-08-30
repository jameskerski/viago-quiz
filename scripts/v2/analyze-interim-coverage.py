#!/usr/bin/env python3
"""Reproducible interim coverage analysis for the VIAGO V2 review bank.

This script is read-only with respect to production/runtime data. It resolves the
latest OWNER-reviewed wording over proposal metadata and writes aggregate review
evidence under data/v2-analysis.
"""

from __future__ import annotations

import json
import math
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "v2-analysis" / "interim-coverage.json"


def load(path: str):
    with (ROOT / path).open(encoding="utf-8") as handle:
        return json.load(handle)


def normalize_type(value: str) -> str:
    normalized = value.upper().replace("-", "_")
    return "SINGLE_SELECT" if normalized == "SINGLE" else normalized


def question_text(item: dict) -> str:
    prompt = item.get("question") or item.get("wording") or item.get("english") or ""
    options = item.get("options") or []
    labels = [option.get("label", "") for option in options]
    return " ".join([prompt, *labels]).strip()


def tokens(text: str) -> list[str]:
    stop = {
        "a", "an", "and", "are", "as", "at", "be", "but", "by", "do", "for",
        "from", "has", "have", "i", "if", "in", "is", "it", "its", "me", "most",
        "my", "of", "on", "or", "so", "that", "the", "their", "them", "they",
        "this", "to", "up", "what", "when", "which", "with", "would", "you",
    }
    raw = re.findall(r"[a-z0-9]+", text.lower())
    return [token for token in raw if token not in stop and len(token) > 1]


def tfidf_vectors(records: list[dict]) -> dict[str, dict[str, float]]:
    docs = {record["id"]: tokens(record["text"]) for record in records}
    document_frequency = Counter()
    for doc in docs.values():
        document_frequency.update(set(doc))
    count = len(docs)
    vectors = {}
    for identifier, doc in docs.items():
        term_frequency = Counter(doc)
        vector = {
            term: frequency * (math.log((1 + count) / (1 + document_frequency[term])) + 1)
            for term, frequency in term_frequency.items()
        }
        norm = math.sqrt(sum(value * value for value in vector.values())) or 1
        vectors[identifier] = {term: value / norm for term, value in vector.items()}
    return vectors


def cosine(left: dict[str, float], right: dict[str, float]) -> float:
    if len(left) > len(right):
        left, right = right, left
    return sum(value * right.get(term, 0) for term, value in left.items())


def pairwise(records: list[dict], left_group: str, right_group: str | None, limit: int) -> list[dict]:
    vectors = tfidf_vectors(records)
    left = [record for record in records if record["group"] == left_group]
    right = left if right_group is None else [record for record in records if record["group"] == right_group]
    pairs = []
    for index, first in enumerate(left):
        candidates = right[index + 1 :] if right_group is None else right
        for second in candidates:
            score = cosine(vectors[first["id"]], vectors[second["id"]])
            pairs.append({
                "left_id": first["id"],
                "right_id": second["id"],
                "cosine": round(score, 4),
                "left_text": first["text"],
                "right_text": second["text"],
            })
    return sorted(pairs, key=lambda pair: (-pair["cosine"], pair["left_id"], pair["right_id"]))[:limit]


def resolve_candidates() -> tuple[list[dict], list[dict]]:
    c1_source = load("data/v2-proposals/cohort-01.json")["proposals"]
    c1_polished = load("data/v2-proposals/cohort-01-polished-candidates.json")["candidates"]
    c1_revisions = load("data/v2-proposals/cohort-01-desirability-balance-revisions.json")["revisions"]
    c2_source = load("data/v2-proposals/cohort-02.json")["candidates"]
    c2_revisions = load("data/v2-proposals/cohort-02-owner-revisions.json")["revisions"]

    c1_metadata = {item["proposal_id"]: item for item in c1_source}
    c1_revision_by_id = {item["proposal_id"]: item for item in c1_revisions}
    cohort_01 = []
    for polished in c1_polished:
        identifier = polished["proposal_id"]
        resolved = {**c1_metadata[identifier], **polished, **c1_revision_by_id.get(identifier, {})}
        resolved["question_type"] = normalize_type(resolved["question_type"])
        resolved["question"] = resolved.get("question") or resolved.get("wording")
        resolved["cohort"] = "Cohort 01"
        cohort_01.append(resolved)

    c2_revision_by_id = {item["proposal_id"]: item for item in c2_revisions}
    cohort_02 = []
    for source in c2_source:
        identifier = source["proposal_id"]
        resolved = {**source, **c2_revision_by_id.get(identifier, {})}
        resolved["question_type"] = normalize_type(resolved["question_type"])
        resolved["cohort"] = "Cohort 02"
        cohort_02.append(resolved)
    return cohort_01, cohort_02


def count_by(items: list[dict], field: str) -> dict[str, int]:
    return dict(sorted(Counter(item[field] for item in items).items()))


def classify_context(context: str) -> str:
    work = {
        "work-business", "team", "leadership", "customer-service", "customer-pressure",
        "onboarding", "team-decision", "technology", "creative-work", "creative-collaboration",
    }
    ordinary = {
        "social", "personal-preference", "travel", "home", "community", "community-event",
        "personal-leisure", "personal-relationship", "daily-routine", "home-transition", "volunteer",
    }
    if context in work:
        return "work_business_or_team"
    if context in ordinary:
        return "ordinary_life_or_community"
    return "cross_context_or_unspecified"


def main() -> None:
    active_audit = load("data/v2-audit/current-question-audit.json")
    active = active_audit["questions"]
    cohort_01, cohort_02 = resolve_candidates()
    candidates = cohort_01 + cohort_02

    active_type = Counter(normalize_type(item["question_type"]) for item in active)
    candidate_type = Counter(item["question_type"] for item in candidates)
    active_likert_colors = Counter(
        item["assigned_color"].lower() for item in active
        if normalize_type(item["question_type"]) == "LIKERT"
    )
    candidate_likert_colors = Counter(
        (item.get("intended_mapping") or item.get("intended_color") or "").lower()
        for item in candidates if item["question_type"] == "LIKERT"
    )
    colors = ["red", "blue", "yellow", "green"]
    active_single = active_type["SINGLE_SELECT"]
    candidate_single = candidate_type["SINGLE_SELECT"]
    color_opportunities = {
        color: {
            "active_likert": active_likert_colors[color],
            "active_single_select": active_single,
            "active_total": active_likert_colors[color] + active_single,
            "candidate_likert": candidate_likert_colors[color],
            "candidate_single_select": candidate_single,
            "candidate_total": candidate_likert_colors[color] + candidate_single,
            "combined_total": active_likert_colors[color] + active_single + candidate_likert_colors[color] + candidate_single,
        }
        for color in colors
    }

    active_domains = Counter(item["proposed_taxonomy"]["behavioral_domain"] for item in active)
    active_contexts = Counter(item["proposed_taxonomy"]["context"] for item in active)
    candidate_domains = Counter(item["behavioral_domain"] for item in candidates)
    candidate_contexts = Counter(item["context"] for item in candidates)
    all_domains = sorted(set(active_domains) | set(candidate_domains))
    combined_domains = {
        domain: {
            "active": active_domains[domain],
            "candidates": candidate_domains[domain],
            "combined": active_domains[domain] + candidate_domains[domain],
        }
        for domain in all_domains
    }

    context_balance = {
        "active": dict(sorted(Counter(classify_context(item["proposed_taxonomy"]["context"]) for item in active).items())),
        "candidates": dict(sorted(Counter(classify_context(item["context"]) for item in candidates).items())),
    }

    semantic_families = count_by(candidates, "semantic_family")
    repeated_families = {family: count for family, count in semantic_families.items() if count > 1}

    text_records = [
        {"id": item["canonical_id"], "text": item["english"], "group": "active"}
        for item in active
    ] + [
        {"id": item["proposal_id"], "text": question_text(item), "group": "candidate"}
        for item in candidates
    ]

    current_single = active_single
    combined_single = active_single + candidate_single
    selected_single = 25
    current_expected_overlap = selected_single * selected_single / current_single
    combined_expected_overlap = selected_single * selected_single / combined_single

    result = {
        "schema_version": "1.0.0",
        "status": "OWNER_REVIEW_COVERAGE_ANALYSIS",
        "production_impact": "NONE",
        "sources": {
            "active_audit": "data/v2-audit/current-question-audit.json",
            "coverage_matrix": "data/v2-audit/coverage-matrix.json",
            "cohort_01_base": "data/v2-proposals/cohort-01.json",
            "cohort_01_polished": "data/v2-proposals/cohort-01-polished-candidates.json",
            "cohort_01_amendments": "data/v2-proposals/cohort-01-desirability-balance-revisions.json",
            "cohort_02_base": "data/v2-proposals/cohort-02.json",
            "cohort_02_amendments": "data/v2-proposals/cohort-02-owner-revisions.json",
        },
        "counts": {
            "active": len(active),
            "cohort_01": len(cohort_01),
            "cohort_02": len(cohort_02),
            "candidates": len(candidates),
            "combined": len(active) + len(candidates),
            "active_by_type": dict(sorted(active_type.items())),
            "candidates_by_type": dict(sorted(candidate_type.items())),
            "combined_by_type": {
                key: active_type[key] + candidate_type[key]
                for key in sorted(set(active_type) | set(candidate_type))
            },
        },
        "color_measurement_opportunities": color_opportunities,
        "domains": combined_domains,
        "active_contexts": dict(sorted(active_contexts.items())),
        "candidate_contexts": dict(sorted(candidate_contexts.items())),
        "context_balance": context_balance,
        "semantic_families": semantic_families,
        "repeated_candidate_semantic_families": repeated_families,
        "lexical_similarity_screen": {
            "method": "TF-IDF cosine over normalized prompt plus options; screening only, not a semantic verdict",
            "candidate_to_candidate_top": pairwise(text_records, "candidate", None, 30),
            "candidate_to_active_top": pairwise(text_records, "candidate", "active", 40),
        },
        "repeat_exposure_projection": {
            "assumption": "Selector continues choosing 25 single-select questions uniformly without replacement from the eligible single-select pool.",
            "current_single_pool": current_single,
            "combined_single_pool_if_all_candidates_later_activated": combined_single,
            "current_per_question_appearance_probability": round(selected_single / current_single, 4),
            "combined_per_question_appearance_probability": round(selected_single / combined_single, 4),
            "current_expected_shared_single_questions_between_two_attempts": round(current_expected_overlap, 4),
            "combined_expected_shared_single_questions_between_two_attempts": round(combined_expected_overlap, 4),
            "current_expected_pairwise_jaccard": round(current_expected_overlap / (2 * selected_single - current_expected_overlap), 4),
            "combined_expected_pairwise_jaccard": round(combined_expected_overlap / (2 * selected_single - combined_expected_overlap), 4),
            "active_likert_per_question_appearance_probability": round(25 / active_type["LIKERT"], 4),
            "combined_likert_per_question_appearance_probability": round(25 / (active_type["LIKERT"] + candidate_type["LIKERT"]), 4),
        },
        "resolved_candidates": [
            {
                "proposal_id": item["proposal_id"],
                "cohort": item["cohort"],
                "question_type": item["question_type"],
                "color": item.get("intended_mapping") or item.get("intended_color") or "one option per color",
                "behavioral_domain": item["behavioral_domain"],
                "context": item["context"],
                "semantic_family": item["semantic_family"],
                "question": item["question"],
                "options": item.get("options", []),
            }
            for item in candidates
        ],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    print(json.dumps({
        "output": str(OUT.relative_to(ROOT)),
        "counts": result["counts"],
        "color_measurement_opportunities": color_opportunities,
        "context_balance": context_balance,
        "repeat_exposure_projection": result["repeat_exposure_projection"],
        "top_candidate_pairs": result["lexical_similarity_screen"]["candidate_to_candidate_top"][:10],
        "top_legacy_pairs": result["lexical_similarity_screen"]["candidate_to_active_top"][:10],
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
