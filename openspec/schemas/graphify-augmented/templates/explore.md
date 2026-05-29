## Domain Overview

<!--
Run: graphify query "<change domain>"
Document the broad codebase context: god nodes, relevant communities, key relationships.
-->

### Communities

| Community | Nodes | Relevance |
|-----------|-------|-----------|
| <!-- community name --> | <!-- key nodes --> | <!-- why relevant --> |

### God Nodes

<!-- Most-connected concepts in the affected area -->

| Node | Degree | Source File |
|------|--------|-------------|
| <!-- node name --> | <!-- degree --> | <!-- source location --> |

## Path Analysis

<!--
Run: graphify path <concept_A> <concept_B>
Trace connections between main components this change touches.
-->

### Path: <concept_A> → <concept_B>

| Hop | Relation | Confidence | Source |
|-----|----------|------------|--------|
| <!-- node A --> | <!-- relation --> | <!-- EXTRACTED/INFERRED --> | <!-- file --> |
| <!-- node B --> | <!-- relation --> | <!-- EXTRACTED/INFERRED --> | <!-- file --> |

### Path: <concept_C> → <concept_D>

<!-- Repeat for each critical path -->

## Deep Dives

<!--
Run: graphify explain <key_concept>
Deep-dive on critical components.
-->

### <Concept Name>

- **Degree**: <!-- number of connections -->
- **Type**: <!-- code/document/paper -->
- **Source**: <!-- source file -->
- **Connections**: <!-- key neighbors with relations -->

<!-- Repeat for each key concept -->

## Graph Gaps

<!-- Nodes or concepts that DON'T exist in the graph.
     This means the codebase area is not yet mapped. -->

- <!-- missing concept -->

## Key Findings

<!-- Surprising connections, architectural insights, risks discovered via graph -->

1. <!-- finding -->
2. <!-- finding -->

## Suggested Queries

<!-- Questions the graph can answer for the next phases -->

- `graphify query "..."` — <!-- what it reveals -->
- `graphify path "..." "..."` — <!-- what it connects -->
