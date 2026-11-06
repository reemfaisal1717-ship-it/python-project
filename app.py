from flask import Flask, render_template, jsonify, request
import sqlite3
from datetime import datetime, timedelta

app = Flask(__name__)

DATABASE = "database.db"


# ==========================================================
# ICU BED CAPACITY
# ==========================================================

WARD_CAPACITY = {
    "ICU-A": 10,
    "ICU-B": 15,
    "ICU-C": 10
}


# ==========================================================
# DATABASE CONNECTION
# ==========================================================

def get_db_connection():

    conn = sqlite3.connect(DATABASE)

    conn.row_factory = sqlite3.Row

    return conn


# ==========================================================
# DELETE EXPIRED PATIENT RECORDS
# ==========================================================

def remove_expired_patients():

    conn = get_db_connection()

    current_time = datetime.now()

    rows = conn.execute("""
        SELECT id, discharge_time
        FROM beds
        WHERE discharge_time IS NOT NULL
        AND status = 'Occupied'
    """).fetchall()

    expired_ids = []

    for row in rows:

        try:

            discharge_time = datetime.strptime(
                row["discharge_time"],
                "%Y-%m-%d %H:%M"
            )

            if discharge_time <= current_time:

                expired_ids.append(row["id"])

        except ValueError:

            pass

    for patient_id in expired_ids:

        conn.execute(
            "DELETE FROM beds WHERE id = ?",
            (patient_id,)
        )

    conn.commit()

    conn.close()


# ==========================================================
# CREATE DATABASE
# ==========================================================

def create_database():

    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS beds (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            patient_id TEXT,

            patient_name TEXT,

            ward TEXT,

            bed_number TEXT,

            admission_time TEXT,

            discharge_time TEXT,

            status TEXT
        )
    """)

    conn.commit()

    # Add sample data only when database is empty
    count = conn.execute(
        "SELECT COUNT(*) FROM beds"
    ).fetchone()[0]

    if count == 0:

        sample_data = [

            (
                "P001",
                "Ravi",
                "ICU-A",
                "A01",
                "2026-09-30 08:30",
                "2026-10-01 10:00",
                "Occupied"
            ),

            (
                "P002",
                "Sita",
                "ICU-A",
                "A02",
                "2026-09-30 09:00",
                "2026-10-01 14:00",
                "Occupied"
            ),

            (
                "P003",
                "Arjun",
                "ICU-B",
                "B01",
                "2026-09-30 10:00",
                "2026-10-01 18:00",
                "Occupied"
            )
        ]

        conn.executemany("""
            INSERT INTO beds
            (
                patient_id,
                patient_name,
                ward,
                bed_number,
                admission_time,
                discharge_time,
                status
            )

            VALUES (?, ?, ?, ?, ?, ?, ?)

        """, sample_data)

        conn.commit()

    conn.close()


# ==========================================================
# HOME PAGE
# ==========================================================

@app.route("/")
def home():

    remove_expired_patients()

    return render_template("index.html")


# ==========================================================
# GET PATIENT RECORDS
# ==========================================================

@app.route("/api/beds")
def get_beds():

    # Remove patients whose planned discharge time has passed
    remove_expired_patients()

    conn = get_db_connection()

    beds = conn.execute("""
        SELECT *
        FROM beds
        ORDER BY ward, bed_number
    """).fetchall()

    conn.close()

    return jsonify([
        dict(bed)
        for bed in beds
    ])


# ==========================================================
# PATIENT ADMISSION
# ==========================================================

@app.route("/api/admit", methods=["POST"])
def admit_patient():

    data = request.get_json()

    patient_id = data.get("patient_id")
    patient_name = data.get("patient_name")
    ward = data.get("ward")
    bed_number = data.get("bed_number")
    admission_time = data.get("admission_time")
    discharge_time = data.get("discharge_time")

    if not patient_id or not patient_name or not ward or not bed_number:

        return jsonify({
            "message": "Please fill all required fields."
        }), 400

    if ward not in WARD_CAPACITY:

        return jsonify({
            "message": "Invalid ICU ward."
        }), 400

    conn = get_db_connection()

    # Check whether selected bed is already occupied
    existing = conn.execute("""
        SELECT *
        FROM beds

        WHERE ward = ?

        AND bed_number = ?

        AND status = 'Occupied'

    """, (
        ward,
        bed_number
    )).fetchone()

    if existing:

        conn.close()

        return jsonify({
            "message": "This bed is already occupied."
        }), 400

    # Check duplicate patient ID
    duplicate_patient = conn.execute("""
        SELECT *
        FROM beds
        WHERE patient_id = ?
    """, (patient_id,)).fetchone()

    if duplicate_patient:

        conn.close()

        return jsonify({
            "message": "This Patient ID already exists."
        }), 400

    conn.execute("""
        INSERT INTO beds
        (
            patient_id,
            patient_name,
            ward,
            bed_number,
            admission_time,
            discharge_time,
            status
        )

        VALUES (?, ?, ?, ?, ?, ?, ?)

    """, (
        patient_id,
        patient_name,
        ward,
        bed_number,
        admission_time,
        discharge_time,
        "Occupied"
    ))

    conn.commit()

    conn.close()

    return jsonify({
        "message": "Patient admitted successfully."
    })


# ==========================================================
# UPDATE PATIENT
# ==========================================================

@app.route("/api/update/<int:patient_id>", methods=["PUT"])
def update_patient(patient_id):

    data = request.get_json()

    patient_name = data.get("patient_name")
    ward = data.get("ward")
    bed_number = data.get("bed_number")
    discharge_time = data.get("discharge_time")

    if not patient_name or not ward or not bed_number:

        return jsonify({
            "message": "Please fill all required fields."
        }), 400

    conn = get_db_connection()

    patient = conn.execute("""
        SELECT *
        FROM beds
        WHERE id = ?
    """, (patient_id,)).fetchone()

    if not patient:

        conn.close()

        return jsonify({
            "message": "Patient record not found."
        }), 404

    # Check whether selected bed belongs to another patient
    existing = conn.execute("""
        SELECT *
        FROM beds

        WHERE ward = ?

        AND bed_number = ?

        AND status = 'Occupied'

        AND id != ?

    """, (
        ward,
        bed_number,
        patient_id
    )).fetchone()

    if existing:

        conn.close()

        return jsonify({
            "message": "Selected bed is already occupied."
        }), 400

    conn.execute("""
        UPDATE beds

        SET
            patient_name = ?,
            ward = ?,
            bed_number = ?,
            discharge_time = ?,
            status = 'Occupied'

        WHERE id = ?

    """, (
        patient_name,
        ward,
        bed_number,
        discharge_time,
        patient_id
    ))

    conn.commit()

    conn.close()

    return jsonify({
        "message": "Patient record updated successfully."
    })


# ==========================================================
# DELETE PATIENT RECORD
# ==========================================================

@app.route("/api/delete/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):

    conn = get_db_connection()

    patient = conn.execute("""
        SELECT *
        FROM beds
        WHERE id = ?
    """, (patient_id,)).fetchone()

    if not patient:

        conn.close()

        return jsonify({
            "message": "Patient record not found."
        }), 404

    conn.execute(
        "DELETE FROM beds WHERE id = ?",
        (patient_id,)
    )

    conn.commit()

    conn.close()

    return jsonify({
        "message": "Patient record deleted successfully."
    })


# ==========================================================
# NEXT-DAY DISCHARGE FORECAST
# ==========================================================

@app.route("/api/discharge-forecast")
def discharge_forecast():

    remove_expired_patients()

    now = datetime.now()

    # Operational day starts at 8:00 AM.
    #
    # If current time is before 8 AM,
    # today's 8 AM is the next operational-day start.
    #
    # Otherwise tomorrow's 8 AM is the next operational-day start.

    today_8am = now.replace(
        hour=8,
        minute=0,
        second=0,
        microsecond=0
    )

    if now < today_8am:

        start_time = today_8am

    else:

        start_time = today_8am + timedelta(days=1)

    end_time = start_time + timedelta(days=1)

    conn = get_db_connection()

    rows = conn.execute("""
        SELECT *
        FROM beds

        WHERE status = 'Occupied'

        AND discharge_time IS NOT NULL

        ORDER BY discharge_time
    """).fetchall()

    conn.close()

    forecast_patients = []

    for row in rows:

        try:

            discharge_time = datetime.strptime(
                row["discharge_time"],
                "%Y-%m-%d %H:%M"
            )

        except ValueError:

            continue

        if start_time <= discharge_time < end_time:

            forecast_patients.append({
                "id": row["id"],
                "patient_id": row["patient_id"],
                "patient_name": row["patient_name"],
                "ward": row["ward"],
                "bed_number": row["bed_number"],
                "discharge_time": row["discharge_time"]
            })

    # Create 24 hourly bars.
    #
    # 08:00 AM -> 09:00 AM
    # ...
    # 07:00 AM -> 08:00 AM

    hourly_forecast = []

    for hour in range(24):

        hour_start = start_time + timedelta(hours=hour)

        hour_end = hour_start + timedelta(hours=1)

        count = 0

        for patient in forecast_patients:

            discharge_time = datetime.strptime(
                patient["discharge_time"],
                "%Y-%m-%d %H:%M"
            )

            if hour_start <= discharge_time < hour_end:

                count += 1

        hourly_forecast.append({

            "hour": hour_start.strftime("%I %p"),

            "count": count

        })

    return jsonify({

        "start_time": start_time.strftime(
            "%Y-%m-%d %I:%M %p"
        ),

        "end_time": end_time.strftime(
            "%Y-%m-%d %I:%M %p"
        ),

        "patients": forecast_patients,

        "hourly": hourly_forecast

    })


# ==========================================================
# START APPLICATION
# ==========================================================

if __name__ == "__main__":

    create_database()

    app.run(
        debug=True
    )