# Glossary map

Yi selected one documentation context per workspace package. Read only the contexts relevant to the task; work across packages needs each affected context. This map does not introduce separate products, runtime boundaries or new architecture layers.

| Context | Responsibility | Glossary | Package ADRs |
| --- | --- | --- | --- |
| `apps/desktop` | Desktop workflows, navigation, local interaction state and platform integration | `apps/desktop/GLOSSARY.md` | `apps/desktop/docs/adr/` |
| `packages/core` | Shared GitHub/domain types, API clients, collections, synchronization and actions | `packages/core/GLOSSARY.md` | `packages/core/docs/adr/` |
| `packages/ui` | Shared UI primitives, component vocabulary and reusable interaction contracts | `packages/ui/GLOSSARY.md` | `packages/ui/docs/adr/` |

Glossaries and ADR directories are created only when terms or decisions are resolved. Missing paths are intentional; proceed without scaffolding empty documents. Cross-package decisions belong in root `docs/adr/` when needed. Reuse core definitions in consuming packages instead of duplicating or redefining them.

See `docs/agents/domain.md` for consumer rules and existing decision authorities. Desktop product context remains in `apps/desktop/PRODUCT.md`.
