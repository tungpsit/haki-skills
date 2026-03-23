<ui_brand>

## Visual Output Formatting

When displaying workflow status, use these conventions for consistent, scannable output:

### Status Indicators

| Status      | Emoji | Meaning                     |
| ----------- | ----- | --------------------------- |
| Pending     | ⏳    | Not started                 |
| Discussed   | 💬    | Decisions captured          |
| Planned     | 📋    | Implementation plan created |
| In Progress | 🔄    | Actively being executed     |
| Completed   | ✅    | Done and verified           |
| Blocked     | ⏸️    | Waiting on dependency/info  |

### Workflow Headers

```
## 🚀 Haki: [Command Name]

**Project:** [project name]
**Phase:** [phase number] — [phase name]
**Progress:** [completed]/[total] tasks | [percent]%
```

### Next Action Display

```
▶ **Next step:** `/haki:[command] [args]`
  [One-line explanation of why]
```

### Task Summary Format

```
### Task [X.Y]: [Name]
**Status:** [emoji] [status]
**Priority:** [N]
**Dependencies:** [list or None]
```

### Progress Bar (Terminal)

```
[████████░░░░░░░░░░░░] 40% (4/10 tasks)
```

</ui_brand>
