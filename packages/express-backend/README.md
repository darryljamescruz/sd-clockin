# Express Backend

This package provides the Express.js server for the clock‑in system.

## Student Status

Students now have a `status` field which captures their current lifecycle state:

- `incoming` – newly created student who has not yet checked in.
- `active` – automatically set after the student's first check‑in.
- `inactive` – automatically set after the student's final check‑out.

The `CheckIn` model includes middleware that updates the associated student's
`status` when check‑in records are saved, so no manual status management is
required.
