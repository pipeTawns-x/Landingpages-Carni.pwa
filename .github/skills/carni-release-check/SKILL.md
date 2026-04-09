---
name: carni-release-check
description: "Delivery and verification workflow for Carni-mvp. Use for PR text, README truthfulness, EBAC submission notes, zip delivery, build verification, and pre-release checks before sharing a version."
user-invocable: true
---

# Carni Release Check

## When to Use

- Preparing a version for delivery
- Writing PR or release text
- Building a submission zip
- Verifying the repo state before shipping
- Ensuring README claims match the implementation

## Procedure

1. Identify the exact version being delivered.
2. Verify whether the target is repo-wide delivery or a scoped educational artifact.
3. Check build or runtime paths that could break the delivery.
4. Write concise release or submission notes grounded in the actual repo state.
5. Keep delivery artifacts small and intentional unless the user explicitly asks for the full repo.

## Output Checklist

- version or commit reference
- what changed
- validation performed
- exact artifact to deliver
- message ready to paste

## References

- [delivery patterns](./references/delivery-patterns.md)
