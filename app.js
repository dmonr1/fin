let fechaActual = new Date();
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let saldoActual = 0;
let ingresosActual = 0;
let gastosActual = 0;
let ultimoMovimiento = null;


function animarOdometer(elemento, desde, hasta, duracion = 500) {
    const format = (n) => n.toFixed(2);

    const desdeStr = format(desde);
    const hastaStr = format(hasta);

    elemento.innerHTML = "";

    const overlapDelay = duracion * 0.25;
    const totalDigits = hastaStr.length;

    for (let i = totalDigits - 1; i >= 0; i--) {
        const char = hastaStr[i];
        const span = document.createElement("span");
        span.classList.add("digit");

        if (char === "-") {
            span.textContent = "-";
            span.style.marginRight = "4px";
            elemento.prepend(span);
            continue;
        }

        if (char === ".") {
            span.classList.add("dot");
            span.textContent = ".";
            elemento.prepend(span);
            continue;
        }

        span.classList.add("num");
        span.textContent = desdeStr[i] || char;
        elemento.prepend(span);

        if (desdeStr[i] !== char) {
            span.animate(
                [
                    { transform: "translateY(0%)" },
                    { transform: "translateY(-25%)" },
                    { transform: "translateY(10%)" },
                    { transform: "translateY(0%)" }
                ],
                {
                    duration: duracion,
                    easing: "ease-in-out",
                    delay: overlapDelay * (totalDigits - 1 - i)
                }
            );

            setTimeout(() => {
                span.textContent = char;
            }, overlapDelay * (totalDigits - 1 - i) + duracion * 0.8);
        }
    }
}

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

    const startDay = firstDay === 0 ? 6 : firstDay - 1;

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

        if (ingresos > 0) {
            const badge = document.createElement("div");
            badge.className = "badge ingreso";

            badge.innerHTML = `+${ingresos > 1 ? `<span class="count">${ingresos}</span>` : ""}`;

            if (
                ultimoMovimiento &&
                ultimoMovimiento.fecha === fechaISO &&
                ultimoMovimiento.tipo === "ingreso"
            ) {
                badge.classList.add("animate");
            }

            div.appendChild(badge);
        }


        if (gastos > 0) {
            const badge = document.createElement("div");
            badge.className = "badge gasto";

            badge.innerHTML = `–${gastos > 1 ? `<span class="count">${gastos}</span>` : ""}`;

            if (
                ultimoMovimiento &&
                ultimoMovimiento.fecha === fechaISO &&
                ultimoMovimiento.tipo === "gasto"
            ) {
                badge.classList.add("animate");
            }

            div.appendChild(badge);
        }


        div.addEventListener("click", () => {
            abrirDetalleDia(fechaISO);
        });

        calendarDays.appendChild(div);
    }

    actualizarResumen();
    ultimoMovimiento = null;
}

function cambiarMes(direccion) {
    const mesSpan = document.getElementById("mesAnio");

    mesSpan.classList.add(
        direccion > 0 ? "mes-out-left" : "mes-out-right"
    );

    setTimeout(() => {
        fechaActual.setMonth(fechaActual.getMonth() + direccion);
        renderCalendar();

        mesSpan.className = "";

        mesSpan.classList.add(
            direccion > 0 ? "mes-in-right" : "mes-in-left"
        );
    }, 200);
}

function guardarMovimiento() {
    const fecha = document.getElementById("fecha").value;
    const tipo = document.getElementById("tipo").value;
    const monto = Number(document.getElementById("monto").value);
    const descripcion = document.getElementById("descripcion").value;

    if (!fecha || !monto) {
        mostrarModal(
            "Campos incompletos",
            "Por favor ingresa la fecha y el monto del movimiento."
        );
        return;
    }

    const nuevo = {
        id: Date.now(),
        fecha,
        tipo,
        monto,
        descripcion
    };

    movimientos.push(nuevo);
    ultimoMovimiento = nuevo;

    localStorage.setItem("movimientos", JSON.stringify(movimientos));
    renderCalendar();
}


function actualizarResumen() {
    let ingresos = 0;
    let gastos = 0;

    movimientos.forEach(m => {
        if (m.tipo === "ingreso") ingresos += m.monto;
        else gastos += m.monto;
    });

    const saldo = ingresos - gastos;

    animarOdometer(document.getElementById("ingresos"), ingresosActual, ingresos);
    animarOdometer(document.getElementById("gastos"), gastosActual, gastos);
    animarOdometer(document.getElementById("saldo"), saldoActual, saldo);

    ingresosActual = ingresos;
    gastosActual = gastos;
    saldoActual = saldo;
}

function mostrarModal(titulo, mensaje) {
    document.getElementById("modalTitle").textContent = titulo;
    document.getElementById("modalMessage").textContent = mensaje;
    document.getElementById("modal").classList.add("show");
}

function cerrarModal() {
    document.getElementById("modal").classList.remove("show");
}

function abrirDetalleDia(fechaISO) {
    const lista = movimientos.filter(m => m.fecha === fechaISO);

    const titulo = document.getElementById("modalDiaTitulo");
    const body = document.getElementById("modalDiaContenido");
    const toggle = document.getElementById("modalDiaToggle");
    const totales = document.getElementById("modalDiaTotales");

    titulo.textContent = `Movimientos · ${fechaISO}`;
    body.innerHTML = "";
    toggle.innerHTML = "";
    totales.innerHTML = "";

    body.className = "modal-dia-body collapsed";

    if (lista.length === 0) {
        body.innerHTML = "<p>No hay movimientos este día.</p>";
        document.getElementById("modalDia").classList.add("show");
        return;
    }

    let ingresos = 0;
    let gastos = 0;

    lista.forEach(m => {
        const item = document.createElement("div");
        item.className = `mov-item ${m.tipo}`;

        item.innerHTML = `
            <div class="mov-info">
                <span>${m.descripcion || "Sin descripción"}</span>
            </div>
            <div class="mov-monto">                
                <strong>${m.tipo === "ingreso" ? "+" : "-"} S/ ${m.monto.toFixed(2)}</strong>
            </div>
            <button class="mov-delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        // ✅ EVENTO ELIMINAR (CLAVE)
        item.querySelector(".mov-delete").addEventListener("click", (e) => {
            e.stopPropagation(); // 🔥 evita que se dispare el click del día
            e.preventDefault();

            movimientos = movimientos.filter(x => x.id !== m.id);
            localStorage.setItem("movimientos", JSON.stringify(movimientos));

            renderCalendar();
            abrirDetalleDia(fechaISO);
        });

        body.appendChild(item);

        if (m.tipo === "ingreso") ingresos += m.monto;
        else gastos += m.monto;
    });

    totales.innerHTML = `
        <div class="mov-total">
            <div>Ingresos: S/ ${ingresos.toFixed(2)}</div>
            <div>Gastos: S/ ${gastos.toFixed(2)}</div>
            <div>Saldo Total: S/ ${(ingresos - gastos).toFixed(2)}</div>
        </div>
    `;

    if (lista.length > 4) {
        toggle.innerHTML = `<div class="toggle-mov">Mostrar más</div>`;

        toggle.firstChild.onclick = () => {
            const expandido = body.classList.contains("expanded");
            body.classList.toggle("expanded", !expandido);
            body.classList.toggle("collapsed", expandido);
            toggle.firstChild.textContent = expandido
                ? "Mostrar más"
                : "Mostrar menos";
        };
    }

    document.getElementById("modalDia").classList.add("show");
}



function cerrarModalDia() {
    document.getElementById("modalDia").classList.remove("show");
}

const toggle = document.getElementById("themeToggle");

document.addEventListener("DOMContentLoaded", () => {
    const theme = localStorage.getItem("theme") || "light";
    document.body.classList.add(theme);
    toggle.checked = theme === "dark";
    renderCalendar();
});

toggle.addEventListener("change", () => {
    const isDark = toggle.checked;
    document.body.classList.toggle("dark", isDark);
    document.body.classList.toggle("light", !isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

renderCalendar();
