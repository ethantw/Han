# Taisol homepage snapshot

This directory is the versioned build input for the seven newspaper reports
used by the han.css homepage. It contains only the four article editions and
their canonical homepage excerpts; `taisol` remains the editorial source.

Refresh the snapshot from a sibling `taisol/` checkout with:

```sh
pnpm --filter han-manual sync:taisol-home
```

Commit changes in both repositories when editorial copy is updated. Normal
han.css builds read this snapshot and do not depend on a directory outside the
repository.
