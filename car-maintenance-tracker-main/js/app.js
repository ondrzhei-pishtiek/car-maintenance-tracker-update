/* === DOM ELEMENTS === */
const taskSelect = document.getElementById("taskSelect");
const mileageInput = document.getElementById("mileageInput");
const dateInput = document.getElementById("dateInput");
const vehicleSelector = document.getElementById("vehicleSelector");
const taskTable = document.getElementById("taskTable");
const fileInput = document.getElementById("fileInput");
const fileNamesDisplay = document.getElementById("fileNames");

const statTotal = document.getElementById("statTotal");
const statAvg = document.getElementById("statAvg");
const statLast = document.getElementById("statLast");
const statPerVehicle = document.getElementById("statPerVehicle");

const addVehicleBtn = document.getElementById("addVehicleBtn");
const newVehicleInput = document.getElementById("newVehicleInput");
const removeVehicleBtn = document.getElementById("removeVehicleBtn");

/* === DATA === */
let tasks = JSON.parse(localStorage.getItem("vehicleTasks")) || [];
let vehicles = JSON.parse(localStorage.getItem("vehicles")) || ["Golf 5 (2.0 TDI)", "BMW X5 E53 (3.0d)"];
let attachedFiles = [];

/* === TASKS SUGGESTIONS === */
const sugList = [
    "Заміна моторної оливи",
    "Заміна масляного фільтра",
    "Заміна повітряного фільтра",
    "Заміна салонного фільтра",
    "Гальмівні колодки (передні)",
    "Гальмівні колодки (задні)",
    "Гальмівні диски",
    "Ремінь ГРМ",
    "Ремінь генератора",
    "Охолоджуюча рідина (антифриз)",
    "Діагностика двигуна",
    "Чистка дросельної заслінки",
    "DPF регенерація / перевірка",
    "Заміна акумулятора",
    "Заміна свічок запалювання",
    "Заміна свічок розжарювання",
    "Заміна паливного фільтра",
    "Заміна трансмісійної оливи",
    "Заміна оливи DSG",
    "Регулювання сход-розвалу",
    "Заміна амортизаторів",
    "Перевірка ходової",
    "Планове ТО",
    "Інше (короткий запис)"
];

/* === POPULATE TASK SELECT === */
function populateTaskSelect() {
    taskSelect.innerHTML = '<option value="">-- Оберіть задачу --</option>';
    sugList.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        taskSelect.appendChild(opt);
    });
}

/* === VEHICLES === */
function saveVehicles() {
    localStorage.setItem("vehicles", JSON.stringify(vehicles));
}

function populateVehicleSelector() {
    vehicleSelector.innerHTML = "";
    vehicles.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        vehicleSelector.appendChild(opt);
    });
}

/* Добавити авто */
addVehicleBtn.addEventListener("click", () => {
    const name = newVehicleInput.value.trim();
    if (!name) {
        alert("Введи назву авто!");
        return;
    }
    if (vehicles.includes(name)) {
        alert("Таке авто вже додано.");
        newVehicleInput.value = "";
        return;
    }
    vehicles.push(name);
    saveVehicles();
    populateVehicleSelector();
    updateStats();
    newVehicleInput.value = "";
});

/* Видалити авто */
removeVehicleBtn.addEventListener("click", () => {
    const selected = vehicleSelector.value;
    if (!selected) return alert("Немає вибраного авто.");
    if (!confirm(`Видалити авто "${selected}" і всі його записи?`)) return;

    vehicles = vehicles.filter(v => v !== selected);
    tasks = tasks.filter(t => t.vehicle !== selected);

    save();
    saveVehicles();
    populateVehicleSelector();
    renderTable();
    updateStats();
});

/* === RENDER TABLE === */
function renderTable(list = tasks) {
    taskTable.innerHTML = "";

    list.forEach((task, index) => {
        const row = document.createElement("tr");
        const color = getColorForString(task.vehicle);

        row.innerHTML = `
            <td><span class="badge" style="background:${color}">${escapeHtml(task.vehicle)}</span></td>
            <td>${escapeHtml(task.text)}</td>
            <td>${Number(task.mileage).toLocaleString()} km</td>
            <td>${escapeHtml(task.date)}</td>
            <td>
                ${task.files ? task.files.map(f => `<a href="${f.url}" target="_blank">${escapeHtml(f.name)}</a>`).join("<br>") : ""}
            </td>
            <td><button class="delete-btn" data-index="${index}">Видалити</button></td>
        `;

        row.querySelector(".delete-btn").addEventListener("click", (e) => {
            deleteTask(Number(e.currentTarget.dataset.index));
        });

        taskTable.appendChild(row);
    });

    updateStats();
}

/* === ADD TASK === */
function addTask() {
    const text = taskSelect.value.trim();
    const mileageRaw = mileageInput.value.replace(/\s+/g, "");
    const date = dateInput.value.trim();
    const vehicle = vehicleSelector.value;

    if (!text || !mileageRaw || !date || !vehicle) {
        alert("Заповни всі поля!");
        return;
    }

    const mileage = Number(mileageRaw);
    if (mileage > 999999) {
        alert("Максимальний пробіг — 999 999!");
        return;
    }

    const inputDate = new Date(date);
    const today = new Date();
    if (inputDate > today) {
        alert("Дата не може бути з майбутнього.");
        return;
    }

    tasks.push({
        text,
        mileage,
        date,
        vehicle,
        files: attachedFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            url: URL.createObjectURL(f)
        }))
    });

    save();

    mileageInput.value = "";
    dateInput.value = getToday();
    fileInput.value = "";
    attachedFiles = [];
    fileNamesDisplay.textContent = "";

    renderTable();
}

/* === DELETE === */
function deleteTask(index) {
    tasks.splice(index, 1);
    save();
    renderTable();
}

/* === SAVE TASKS === */
function save() {
    localStorage.setItem("vehicleTasks", JSON.stringify(tasks));
}

/* === STATS === */
function updateStats() {
    statTotal.textContent = tasks.length;

    if (tasks.length > 0) {
        statAvg.textContent = Math.round(tasks.reduce((a, b) => a + Number(b.mileage), 0) / tasks.length);
        statLast.textContent = tasks[tasks.length - 1].text;
    } else {
        statAvg.textContent = 0;
        statLast.textContent = "—";
    }

    const counts = {};
    vehicles.forEach(v => counts[v] = 0);
    tasks.forEach(t => counts[t.vehicle]++);

    statPerVehicle.innerHTML = "";
    Object.keys(counts).forEach(v => {
        const div = document.createElement("div");
        div.className = "stat-vehicle";
        div.innerHTML = `<strong>${escapeHtml(v)}:</strong> ${counts[v]}`;
        statPerVehicle.appendChild(div);
    });
}

/* === FILTER === */
document.getElementById("filterBtn").onclick = () => {
    const maxM = Number(document.getElementById("filterMileage").value);
    if (!maxM) return renderTable();

    const filtered = tasks.filter(t => t.mileage <= maxM);
    renderTable(filtered);
};

document.getElementById("resetFilterBtn").onclick = () => {
    document.getElementById("filterMileage").value = "";
    renderTable();
};

/* === EXPORT JSON === */
document.getElementById("exportBtn").onclick = () => {
    const data = JSON.stringify({ vehicles, tasks }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicle_tasks.json";
    a.click();
};

/* === EXPORT CSV === */
document.getElementById("exportCsvBtn").onclick = () => {
    if (tasks.length === 0) {
        alert("Немає записів для експорту!");
        return;
    }

    const headers = ["Авто", "Задача", "Пробіг (км)", "Дата"];
    const rows = tasks.map(t => [
        `"${t.vehicle}"`,
        `"${t.text}"`,
        t.mileage,
        t.date
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicle_tasks.csv";
    a.click();
};

/* === CLEAR ALL === */
document.getElementById("clearAll").onclick = () => {
    if (confirm("Видалити всі дані?")) {
        tasks = [];
        vehicles = [];
        save();
        saveVehicles();
        renderTable();
        populateVehicleSelector();
        updateStats();
    }
};

/* === DARK THEME === */
document.getElementById("themeBtn").onclick = () => {
    document.body.classList.toggle("dark");
};

/* === UTILITIES === */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function getColorForString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

/* === AUTO-FORMATTING MILEAGE === */
mileageInput.addEventListener("input", () => {
    let v = mileageInput.value.replace(/[^\d]/g, "");
    mileageInput.value = v.replace(/\B(?=(\d{6})+(?!\d))/g, " ");
});

/* === FILE INPUT HANDLER === */
fileInput.addEventListener("change", () => {
    attachedFiles = Array.from(fileInput.files);
    fileNamesDisplay.textContent = attachedFiles.map(f => f.name).join(", ");
});

/* === AUTO SET TODAY === */
function getToday() {
    return new Date().toISOString().split("T")[0];
}

dateInput.value = getToday();

/* === INIT === */
populateTaskSelect();
populateVehicleSelector();
renderTable();
updateStats();
document.getElementById("addBtn").onclick = addTask;
