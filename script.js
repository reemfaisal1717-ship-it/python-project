// ==========================================================
// GLOBAL VARIABLES
// ==========================================================

let beds = [];

let forecastChart = null;


// ==========================================================
// ICU CAPACITY
// ==========================================================

const wardCapacity = {

    "ICU-A": 10,

    "ICU-B": 15,

    "ICU-C": 10

};


// ==========================================================
// PHYSICAL BED NUMBERS
// ==========================================================

const allBeds = {

    "ICU-A": [],

    "ICU-B": [],

    "ICU-C": []

};


// ICU-A: A01 - A10
for (let i = 1; i <= 10; i++) {

    allBeds["ICU-A"].push(
        "A" + String(i).padStart(2, "0")
    );

}


// ICU-B: B01 - B15
for (let i = 1; i <= 15; i++) {

    allBeds["ICU-B"].push(
        "B" + String(i).padStart(2, "0")
    );

}


// ICU-C: C01 - C10
for (let i = 1; i <= 10; i++) {

    allBeds["ICU-C"].push(
        "C" + String(i).padStart(2, "0")
    );

}


// ==========================================================
// LOAD PATIENT RECORDS
// ==========================================================

async function loadBeds() {

    try {

        const response =
            await fetch("/api/beds");

        beds =
            await response.json();

        updateDashboard();

        createBedVisualization();

        createWardTable();

        createPatientTable();

        updateBedDropdown();

    }

    catch (error) {

        console.error(
            "Error loading patient records:",
            error
        );

    }

}


// ==========================================================
// DASHBOARD
// ==========================================================

function updateDashboard() {

    const totalBeds = 35;


    const occupiedBeds =
        beds.filter(
            bed =>
                bed.status === "Occupied"
        ).length;


    const availableBeds =
        totalBeds - occupiedBeds;


    const occupancy =
        Math.round(
            (occupiedBeds / totalBeds) * 100
        );


    document.getElementById(
        "totalBeds"
    ).innerText = totalBeds;


    document.getElementById(
        "occupiedBeds"
    ).innerText =
        occupiedBeds;


    document.getElementById(
        "availableBeds"
    ).innerText =
        availableBeds;


    document.getElementById(
        "occupancy"
    ).innerText =
        occupancy + "%";

}


// ==========================================================
// BED VISUALIZATION
// ==========================================================

function createBedVisualization() {

    const container =
        document.getElementById(
            "bedVisualization"
        );


    container.innerHTML = "";


    for (const ward in allBeds) {


        const wardSection =
            document.createElement("div");


        wardSection.className =
            "ward-section";


        const title =
            document.createElement("h3");


        title.innerText =
            ward;


        wardSection.appendChild(
            title
        );


        const grid =
            document.createElement("div");


        grid.className =
            "bed-grid";


        allBeds[ward].forEach(
            function(bedNumber) {


                const patient =
                    beds.find(
                        bed =>

                            bed.ward === ward &&

                            bed.bed_number === bedNumber &&

                            bed.status === "Occupied"
                    );


                const bed =
                    document.createElement(
                        "button"
                    );


                bed.type = "button";


                if (patient) {

                    bed.className =
                        "bed occupied-bed";

                }

                else {

                    bed.className =
                        "bed available-bed";

                }


                bed.innerHTML = `

                    <strong>
                        ${bedNumber}
                    </strong>

                    <small>

                        ${
                            patient
                                ? patient.patient_name
                                : "Available"
                        }

                    </small>

                `;


                bed.addEventListener(
                    "click",
                    function() {

                        showBedDetails(
                            ward,
                            bedNumber,
                            patient
                        );

                    }
                );


                grid.appendChild(
                    bed
                );

            }
        );


        wardSection.appendChild(
            grid
        );


        container.appendChild(
            wardSection
        );

    }

}


// ==========================================================
// BED DETAILS
// ==========================================================

function showBedDetails(
    ward,
    bedNumber,
    patient
) {

    if (patient) {

        alert(

            "Bed: " +
            ward +
            " " +
            bedNumber +

            "\nPatient: " +
            patient.patient_name +

            "\nPatient ID: " +
            patient.patient_id +

            "\nPlanned Discharge: " +
            formatDateTime(
                patient.discharge_time
            ) +

            "\nStatus: Occupied"

        );

    }

    else {

        alert(

            "Bed: " +
            ward +
            " " +
            bedNumber +

            "\nStatus: Available"

        );

    }

}


// ==========================================================
// WARD TABLE
// ==========================================================

function createWardTable() {

    const table =
        document.getElementById(
            "wardTable"
        );


    table.innerHTML = "";


    for (const ward in wardCapacity) {


        const total =
            wardCapacity[ward];


        const occupied =
            beds.filter(

                bed =>

                    bed.ward === ward &&

                    bed.status === "Occupied"

            ).length;


        const available =
            total - occupied;


        const percentage =
            Math.round(
                (occupied / total) * 100
            );


        table.innerHTML += `

            <tr>

                <td>
                    ${ward}
                </td>

                <td>
                    ${total}
                </td>

                <td>
                    ${occupied}
                </td>

                <td>
                    ${available}
                </td>

                <td>
                    ${percentage}%
                </td>

            </tr>

        `;

    }

}


// ==========================================================
// PATIENT RECORDS TABLE
// ==========================================================

function createPatientTable() {

    const table =
        document.getElementById(
            "patientTable"
        );


    table.innerHTML = "";


    if (beds.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-message"
                >

                    No active patient records.

                </td>

            </tr>

        `;

        return;

    }


    beds.forEach(
        function(bed) {


            table.innerHTML += `

                <tr>

                    <td>
                        ${bed.id}
                    </td>

                    <td>
                        ${bed.patient_id}
                    </td>

                    <td>
                        ${bed.patient_name}
                    </td>

                    <td>
                        ${bed.ward}
                    </td>

                    <td>
                        ${bed.bed_number}
                    </td>

                    <td>
                        ${formatDateTime(
                            bed.admission_time
                        )}
                    </td>

                    <td>
                        ${formatDateTime(
                            bed.discharge_time
                        )}
                    </td>

                    <td>

                        <span class="status">

                            ${bed.status}

                        </span>

                    </td>

                </tr>

            `;

        }
    );

}


// ==========================================================
// BED DROPDOWN
// ==========================================================

function updateBedDropdown() {

    const ward =
        document.getElementById(
            "ward"
        ).value;


    const dropdown =
        document.getElementById(
            "bed_number"
        );


    dropdown.innerHTML = `

        <option value="">

            Select available bed

        </option>

    `;


    if (!ward) {

        return;

    }


    allBeds[ward].forEach(
        function(bedNumber) {


            const occupied =
                beds.some(

                    bed =>

                        bed.ward === ward &&

                        bed.bed_number === bedNumber &&

                        bed.status === "Occupied"

                );


            if (!occupied) {

                dropdown.innerHTML += `

                    <option value="${bedNumber}">

                        ${bedNumber}

                    </option>

                `;

            }

        }
    );

}


// ==========================================================
// WARD CHANGE
// ==========================================================

document.getElementById(
    "ward"
).addEventListener(
    "change",
    updateBedDropdown
);


// ==========================================================
// PATIENT ADMISSION
// ==========================================================

document.getElementById(
    "admitForm"
).addEventListener(
    "submit",
    async function(event) {


        event.preventDefault();


        const data = {


            patient_id:

                document.getElementById(
                    "patient_id"
                ).value,


            patient_name:

                document.getElementById(
                    "patient_name"
                ).value,


            ward:

                document.getElementById(
                    "ward"
                ).value,


            bed_number:

                document.getElementById(
                    "bed_number"
                ).value,


            admission_time:

                document.getElementById(
                    "admission_time"
                ).value,


            discharge_time:

                document.getElementById(
                    "discharge_time"
                ).value

        };


        // Convert datetime-local format
        // YYYY-MM-DDTHH:MM
        // into
        // YYYY-MM-DD HH:MM

        data.admission_time =
            data.admission_time.replace(
                "T",
                " "
            );


        data.discharge_time =
            data.discharge_time.replace(
                "T",
                " "
            );


        const response =
            await fetch(
                "/api/admit",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            data
                        )

                }
            );


        const result =
            await response.json();


        document.getElementById(
            "message"
        ).innerText =
            result.message;


        if (response.ok) {


            document.getElementById(
                "message"
            ).className =
                "success-message";


            document.getElementById(
                "admitForm"
            ).reset();


            await loadBeds();


            await loadForecast();

        }

        else {

            document.getElementById(
                "message"
            ).className =
                "error-message";

        }

    }
);


// ==========================================================
// OPEN UPDATE MODAL
// ==========================================================

function openEdit(id) {

    const patient =
        beds.find(
            bed =>
                bed.id === id
        );


    if (!patient) {

        return;

    }


    document.getElementById(
        "editId"
    ).value =
        patient.id;


    document.getElementById(
        "editName"
    ).value =
        patient.patient_name;


    document.getElementById(
        "editWard"
    ).value =
        patient.ward;


    document.getElementById(
        "editDischarge"
    ).value =
        convertToDateTimeLocal(
            patient.discharge_time
        );


    updateEditBedDropdown(
        patient.ward,
        patient.bed_number
    );


    document.getElementById(
        "editModal"
    ).style.display =
        "flex";

}


// ==========================================================
// UPDATE BED DROPDOWN
// ==========================================================

function updateEditBedDropdown(
    ward,
    currentBed
) {

    const dropdown =
        document.getElementById(
            "editBed"
        );


    dropdown.innerHTML = "";


    allBeds[ward].forEach(
        function(bedNumber) {


            const occupied =
                beds.some(

                    bed =>

                        bed.ward === ward &&

                        bed.bed_number === bedNumber &&

                        bed.status === "Occupied"

                );


            if (
                !occupied ||
                bedNumber === currentBed
            ) {


                dropdown.innerHTML += `

                    <option
                        value="${bedNumber}"
                    >

                        ${bedNumber}

                    </option>

                `;

            }

        }
    );


    dropdown.value =
        currentBed;

}


// ==========================================================
// EDIT WARD CHANGE
// ==========================================================

document.getElementById(
    "editWard"
).addEventListener(
    "change",
    function() {

        updateEditBedDropdown(
            this.value,
            ""
        );

    }
);


// ==========================================================
// SAVE UPDATE
// ==========================================================

async function saveUpdate() {

    const id =
        document.getElementById(
            "editId"
        ).value;


    const discharge =
        document.getElementById(
            "editDischarge"
        ).value;


    const data = {


        patient_name:

            document.getElementById(
                "editName"
            ).value,


        ward:

            document.getElementById(
                "editWard"
            ).value,


        bed_number:

            document.getElementById(
                "editBed"
            ).value,


        discharge_time:

            discharge.replace(
                "T",
                " "
            )

    };


    const response =
        await fetch(
            "/api/update/" + id,
            {

                method: "PUT",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        data
                    )

            }
        );


    const result =
        await response.json();


    alert(
        result.message
    );


    if (response.ok) {


        closeModal();


        await loadBeds();


        await loadForecast();

    }

}


// ==========================================================
// CLOSE MODAL
// ==========================================================

function closeModal() {

    document.getElementById(
        "editModal"
    ).style.display =
        "none";

}


// ==========================================================
// DELETE PATIENT
// ==========================================================

async function deletePatient(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this patient record?"
        );


    if (!confirmDelete) {

        return;

    }


    const response =
        await fetch(
            "/api/delete/" + id,
            {

                method: "DELETE"

            }
        );


    const result =
        await response.json();


    alert(
        result.message
    );


    if (response.ok) {


        await loadBeds();


        await loadForecast();

    }

}


// ==========================================================
// NEXT-DAY DISCHARGE FORECAST
// ==========================================================

async function loadForecast() {

    try {


        const response =
            await fetch(
                "/api/discharge-forecast"
            );


        const data =
            await response.json();


        document.getElementById(
            "forecastPeriod"
        ).innerText =

            "Forecast window: " +
            data.start_time +
            " → " +
            data.end_time;


        createForecastChart(
            data.hourly
        );


        createForecastPatientTable(
            data.patients
        );


    }

    catch (error) {

        console.error(
            "Error loading discharge forecast:",
            error
        );

    }

}


// ==========================================================
// CREATE FORECAST BAR CHART
// ==========================================================

function createForecastChart(
    hourlyData
) {

    const canvas =
        document.getElementById(
            "forecastChart"
        );


    if (forecastChart) {

        forecastChart.destroy();

    }


    const labels =
        hourlyData.map(
            item =>
                item.hour
        );


    const values =
        hourlyData.map(
            item =>
                item.count
        );


    forecastChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Scheduled Discharges",

                            data:
                                values,

                            borderWidth: 1

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                stepSize: 1

                            },

                            title: {

                                display: true,

                                text:
                                    "Number of Patients"

                            }

                        },


                        x: {

                            title: {

                                display: true,

                                text:
                                    "Discharge Time"

                            }

                        }

                    },


                    plugins: {

                        legend: {

                            display: true

                        }

                    }

                }

            }
        );

}


// ==========================================================
// FORECAST PATIENT TABLE
// ==========================================================

function createForecastPatientTable(
    patients
) {

    const table =
        document.getElementById(
            "forecastPatientTable"
        );


    table.innerHTML = "";


    if (patients.length === 0) {


        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-message"
                >

                    No patients are scheduled
                    for discharge in the
                    next 8 AM to 8 AM period.

                </td>

            </tr>

        `;


        return;

    }


    patients.forEach(
        function(patient) {


            table.innerHTML += `

                <tr>

                    <td>
                        ${patient.patient_id}
                    </td>

                    <td>
                        ${patient.patient_name}
                    </td>

                    <td>
                        ${patient.ward}
                    </td>

                    <td>
                        ${patient.bed_number}
                    </td>

                    <td>
                        ${formatDateTime(
                            patient.discharge_time
                        )}
                    </td>

                </tr>

            `;

        }
    );

}


// ==========================================================
// DATE/TIME FORMATTING
// ==========================================================

function formatDateTime(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(
            value.replace(
                " ",
                "T"
            )
        );


    if (isNaN(date)) {

        return value;

    }


    return date.toLocaleString(
        "en-IN",
        {

            day: "2-digit",

            month: "2-digit",

            year: "numeric",

            hour: "2-digit",

            minute: "2-digit",

            hour12: true

        }
    );

}


// ==========================================================
// CONVERT DATABASE TIME TO HTML DATETIME-LOCAL
// ==========================================================

function convertToDateTimeLocal(
    value
) {

    if (!value) {

        return "";

    }


    return value.replace(
        " ",
        "T"
    );

}


// ==========================================================
// AUTOMATIC REFRESH
// ==========================================================

async function refreshDashboard() {

    await loadBeds();

    await loadForecast();

}


// Refresh every 30 seconds
setInterval(
    refreshDashboard,
    30000
);


// ==========================================================
// INITIAL LOAD
// ==========================================================

loadBeds();

loadForecast();