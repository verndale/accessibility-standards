---
date: 2026-09-29
topics: [sync-and-enforcement]
issue: https://github.com/verndale/accessibility-standards/issues/27
---
# Reject hidden PR descriptions

The canonical PR gate previously accepted headings hidden inside HTML comments or Markdown fences, and could mistake example headings for real sections. It now recognizes visible, same-line headings outside those constructs, including when an HTML comment is left unclosed. Fenced verification evidence under a real section remains valid.

Focused tests exercise the canonical template, hidden bodies, malformed headings, and LF and CRLF descriptions. This changes only repository delivery validation; the package and release policy are unchanged.
