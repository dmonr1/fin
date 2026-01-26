let fechaActual = new Date();
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];

/* ===================== */
/* CALENDARIO */
/* ===================== */

function renderCalendar() {
    const year = fechaActual.getFullYear();
    const month = fechaActual.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = document.getElementById("calendarDays");
    calendarDays.innerHTML = "";

    const mesAnio = document.getElementById("mesAnio");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    mesAnio.textContent = `${meses[month]} ${year}`;

    let startDay = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startDay; i++) {
        calendarDays.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const div = document.createElement("div");
        div.classList.add("calendar-day");
        div.innerHTML = `<span>${day}</span>`;

        const fechaISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const delDia = movimientos.filter(m => m.fecha === fechaISO);

        const ingresos = delDia.filter(m => m.tipo === "ingreso").length;
        const gastos = delDia.filter(m => m.tipo === "gasto").length;

        // INGRESOS
        if (ingresos > 0) {
            const badge = document.createElement("div");
            badge.className = "badge ingreso";
            badge.innerHTML = `
        +
        ${ingresos > 1 ? `<span class="count">${ingresos}</span>` : ""}
    `;
            div.appendChild(badge);
        }

        // GASTOS
        if (gastos > 0) {
            const badge = document.createElement("div");
            badge.className = "badge gasto";
            badge.innerHTML = `
        –
        ${gastos > 1 ? `<span class="count">${gastos}</span>` : ""}
    `;
            div.appendChild(badge);
        }


        calendarDays.appendChild(div);
    }

    actualizarResumen();
}

function cambiarMes(v) {
    fechaActual.setMonth(fechaActual.getMonth() + v);
    renderCalendar();
}

/* ===================== */
/* MOVIMIENTOS */
/* ===================== */

function guardarMovimiento() {
    const fecha = document.getElementById("fecha").value;
    const tipo = document.getElementById("tipo").value;
    const monto = Number(document.getElementById("monto").value);
    const descripcion = document.getElementById("descripcion").value;

    if (!fecha || !monto) {
        alert("Completa fecha y monto");
        return;
    }

    movimientos.push({
        id: Date.now(),
        fecha,
        tipo,
        monto,
        descripcion
    });

    localStorage.setItem("movimientos", JSON.stringify(movimientos));
    renderCalendar();
}

/* ===================== */
/* RESUMEN */
/* ===================== */

function actualizarResumen() {
    let ingresos = 0;
    let gastos = 0;

    movimientos.forEach(m => {
        if (m.tipo === "ingreso") ingresos += m.monto;
        else gastos += m.monto;
    });

    document.getElementById("ingresos").textContent = ingresos.toFixed(2);
    document.getElementById("gastos").textContent = gastos.toFixed(2);
    document.getElementById("saldo").textContent = (ingresos - gastos).toFixed(2);
}

renderCalendar();

/* ===================== */
/* 🌙 TEMA */
/* ===================== */

const toggle = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggle.checked = true;
}

toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
});
