# ICU Bed Occupancy Dashboard — Flask + SQLite version

This is the database-backed version of the dashboard. Instead of the event
log living in a JavaScript array in memory, it is stored permanently in a
SQLite database (`database.db`), served through a small Flask API.

## Folder structure

```
icu-dashboard-flask/
├── app.py                 <- Flask backend + database setup
├── database.db             <- created automatically on first run
├── templates/
│   └── index.html          <- page structure
└── static/
    ├── style.css            <- styling
    └── script.js            <- fetches data from the API, runs the two
                                 core algorithms, renders everything
```

## What's in the database

Two tables:

- **wards** — one row per ICU ward (`id`, `name`, `total_beds`)
- **events** — the admissions sheet itself: one row per admit / transfer /
  discharge event (`patient_id`, `ward`, `bed`, `event_type`, `event_time`,
  `planned_discharge`)

Current bed status is **never stored directly** — it is always calculated
from the `events` table, using the same "latest event per patient" logic
as the original in-browser version. That's what fixes the duplicate-record
bug when a patient is transferred.

## How to run it

1. Install Flask (only needed once):
   ```
   pip install flask
   ```

2. From inside the `icu-dashboard-flask` folder, run:
   ```
   python app.py
   ```

3. Open your browser to:
   ```
   http://127.0.0.1:5000/
   ```

The first time it runs, `app.py` automatically creates `database.db` and
fills it with 4 sample wards and 11 sample events, so the dashboard has
data to show immediately.

## Using it

- **Live Bed Status** — bed grid per ward, computed from the latest event
  per patient. A bed outlined in red is one a naive row-count system would
  have gotten wrong (a stale record left behind by a transfer).
- **Next-Day Discharge Forecast** — tick the checkbox to switch between
  counting by midnight vs. counting by a 07:00–07:00 clinical day, and
  watch the numbers (and the note underneath) change.
- **Add Event form** — add a real admit / transfer / discharge row. It is
  inserted into `database.db` through `POST /api/event`, and the whole
  dashboard re-fetches and re-renders from the database afterwards.

## API endpoints

| Method | Route          | What it does                                   |
|--------|----------------|-------------------------------------------------|
| GET    | `/api/wards`   | Returns all wards and their bed capacity        |
| GET    | `/api/events`  | Returns the full admissions event log           |
| POST   | `/api/event`   | Inserts one new event (admit/transfer/discharge)|

## To reset the sample data

Stop the server (`Ctrl + C`), delete `database.db`, and run `python app.py`
again — it will be recreated with the original sample wards and events.
