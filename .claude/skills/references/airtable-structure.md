# Airtable Structure Reference

Quick reference for Inbound Square Airtable base structure.

## Base Information

**Base Name:** Content
**Base ID:** `appvRZDyTZafVdfEW`

## Tables

### Articles Table
**Table ID:** `tblLKd6kmtCW1txXY`

## Commonly Used Field IDs

### Article Identification
- **Article Title**: `fldSa0M7qnXmU73Qs`
- **Article Google Docs**: `fldKgz3FGt91dAqLo`
- **ID**: `fldBQDuzlNRNq96cg`

### Stage and Status
- **Stage**: `fldJtd5OuDBjA3aML`
- **Last Stage Change**: `fldHYGhFHzuP5cpOo`
- **Last Modified**: `fldAXQCw3yHKhCnNw`
- **Article Overdue**: `fldbE1N2Xl10NrEgl`
- **Article Overdue By**: `fldtlnZOdV9g5bZgA`
- **Stage Change Delay**: `fldmDVOpd9HxYI19o`

### Project Information
- **Project**: `fldxDblxk4vdgzjGP` (link to Projects table)
- **Project Code**: `fldx9bRdl0V5L21lT`
- **Clients**: `fldQgGy7a8yWVjKII`

### Manager/PM Information
- **Project Manager**: `fldObCPcVhV7Zb7gP` (link to People table)
- **PM**: `fld7TlCe7NNQYGmBQ` (name)
- **PM Email**: `fldMraBT0WfvGHxcY`
- **Manager**: `fldNcF2YZW1BCRFUM` (name)

### Peer Reviewer Information
- **Peer Reviewer**: `fld91sRfdhOlbonmw` (link to People table)
- **Peer Reviewer Email**: `fldnuOOqkpPr9JTHp`
- **Peer Review By**: `fldqVTGlLqvgwxGFG`

### Due Dates
- **Draft Due**: `fldZF6f4f5S6t8G4W`
- **Outline Due**: `fldlLb5kXqO5MAmew`
- **Outline Google Doc**: `fld4wVNAJFVe2NhtU`

### PM Attention Tracking
- **Needs PM Attention**: `fld9mSqFxjLDZxs1o`
- **Waiting on Manager Review**: `fldLgV8t3FN7YIXge`
- **Waiting on Author (Days)**: `fldoAYPBOIlGU8q7K`

### Author Information
- **Author**: `fld7RYbfnqPD89aoy` (link to People table)
- **Author Name**: `fldVELKOu5FJnfYxB`
- **Author Email**: `fldEp36zf2oy4MKwF`

## Related Tables

- **Projects Table**: `tblB8hM4NVIdZwduu`
- **People Table**: `tblZ7o9S26PY6yxPv`
- **Clients Table**: `tblAH12T3dDKahZMn`

## Usage

When querying Airtable records:
```javascript
baseId: "appvRZDyTZafVdfEW"
tableId: "tblLKd6kmtCW1txXY"
fields: {
  "fldSa0M7qnXmU73Qs": "Article Title",
  "fldJtd5OuDBjA3aML": "Stage",
  "fldx9bRdl0V5L21lT": "Project Code"
}
```
