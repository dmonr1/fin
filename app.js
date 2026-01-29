let fechaActual = new Date();
let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let saldoActual = 0;
let ingresosActual = 0;
let gastosActual = 0;
let ultimoMovimiento = null;


let movimientosFijos = JSON.parse(
    localStorage.getItem("movimientosFijos")
) || [];


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
    actualizarResumenFijo();
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

    const saldoInicial = Number(localStorage.getItem("saldoInicial")) || 0;

    movimientos.forEach(m => {
        if (m.tipo === "ingreso") ingresos += m.monto;
        else gastos += m.monto;
    });

    const saldo = saldoInicial + ingresos - gastos;

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
        
            <div class="mov-actions">
                <button class="mov-edit" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="mov-delete" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        item.querySelector(".mov-delete").addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();

            movimientos = movimientos.filter(x => x.id !== m.id);
            localStorage.setItem("movimientos", JSON.stringify(movimientos));

            renderCalendar();
            abrirDetalleDia(fechaISO);
        });

        item.querySelector(".mov-edit").addEventListener("click", (e) => {
            e.stopPropagation();
            abrirModalEditarMovimiento(m);
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

    if (!localStorage.getItem("saldoInicial")) {
        mostrarModalSaldo();
    } else {
        ejecutarMovimientosFijosHoy(); 
        renderCalendar();
    }
});

toggle.addEventListener("change", () => {
    const isDark = toggle.checked;
    document.body.classList.toggle("dark", isDark);
    document.body.classList.toggle("light", !isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

renderCalendar();

function mostrarModalSaldo() {
    document.getElementById("modalSaldo").classList.add("show");
}

function guardarSaldoInicial() {
    const input = document.getElementById("saldoInicialInput");
    const valor = Number(input.value);

    if (!valor || valor < 0) {
        alert("Ingresa un saldo válido");
        return;
    }

    localStorage.setItem("saldoInicial", valor);
    document.getElementById("modalSaldo").classList.remove("show");

    renderCalendar();
}

let alertas = JSON.parse(localStorage.getItem("alertas")) || [];

function hoyISO() {
    return new Date().toISOString().split("T")[0];
}

function diasRestantes(fecha) {
    return Math.ceil((new Date(fecha) - new Date()) / 86400000);
}

function actualizarBadge() {
    const hoy = hoyISO();
    const hoyCount = alertas.filter(a => a.fecha === hoy).length;

    const badge = document.getElementById("countNotificaciones");
    if (!badge) return;

    badge.textContent = hoyCount;
    badge.style.display = hoyCount > 0 ? "flex" : "none";
}

function renderNotificaciones() {
    const hoy = hoyISO();
    const contHoy = document.getElementById("listaHoy");
    const contProx = document.getElementById("listaProximas");

    contHoy.innerHTML = "";
    contProx.innerHTML = "";

    let hoyCount = 0;
    let proxCount = 0;

    alertas.forEach(a => {
        const item = document.createElement("div");
        item.className = "notif-item";

        if (a.fecha === hoy) {
            hoyCount++;
            item.textContent = a.descripcion;
            contHoy.appendChild(item);
        }
        else if (a.fecha > hoy) {
            proxCount++;
            item.textContent =
                `En ${diasRestantes(a.fecha)} día(s) · ${a.descripcion}`;
            contProx.appendChild(item);
        }
    });

    document.getElementById("badgeHoy").textContent = hoyCount;
    document.getElementById("badgeProx").textContent = proxCount;

    if (!contHoy.innerHTML)
        contHoy.innerHTML = "<p class='empty'>Sin alertas hoy</p>";

    if (!contProx.innerHTML)
        contProx.innerHTML = "<p class='empty'>Sin próximas alertas</p>";
}

function togglePanel() {
    const panel = document.getElementById("notifPanel");
    panel.classList.toggle("show");

    if (panel.classList.contains("show")) {
        renderNotificaciones();
        mostrarHoy();
    }
}

function mostrarHoy() {
    document.getElementById("sectionHoy").classList.remove("hidden");
    document.getElementById("sectionProx").classList.add("hidden");

    document.querySelector(".badge-card.hoy").classList.add("active");
    document.querySelector(".badge-card.prox").classList.remove("active");
}

function mostrarProximas() {
    document.getElementById("sectionHoy").classList.add("hidden");
    document.getElementById("sectionProx").classList.remove("hidden");

    document.querySelector(".badge-card.hoy").classList.remove("active");
    document.querySelector(".badge-card.prox").classList.add("active");
}

function agregarAlerta(fecha, descripcion) {
    alertas.push({
        id: Date.now(),
        fecha,
        descripcion
    });

    localStorage.setItem("alertas", JSON.stringify(alertas));
    actualizarBadge();
}

function abrirModalNuevaAlerta() {
    document.getElementById("modalNuevaAlerta").classList.add("show");
}

function cerrarModalNuevaAlerta() {
    document.getElementById("modalNuevaAlerta").classList.remove("show");
    document.getElementById("alertaFecha").value = "";
    document.getElementById("alertaDescripcion").value = "";
}

function guardarNuevaAlerta() {
    const fecha = document.getElementById("alertaFecha").value;
    const descripcion = document.getElementById("alertaDescripcion").value.trim();

    if (!fecha || !descripcion) {
        alert("Completa todos los campos");
        return;
    }

    agregarAlerta(fecha, descripcion);
    cerrarModalNuevaAlerta();
}

function verificarAlertasHoy() {
    const hoy = hoyISO();
    const hoyCount = alertas.filter(a => a.fecha === hoy).length;

    if (hoyCount === 0) return;

    const key = `alertasHoyMostradas_${hoy}`;
    if (localStorage.getItem(key)) return;

    document.getElementById("mensajeHoy").textContent =
        `Tienes ${hoyCount} alerta${hoyCount > 1 ? "s" : ""} programada${hoyCount > 1 ? "s" : ""} para hoy.`;

    document.getElementById("modalHoy").classList.add("show");
    localStorage.setItem(key, "true");
}

function abrirDesdeModal() {
    document.getElementById("modalHoy").classList.remove("show");
    document.getElementById("notifPanel").classList.add("show");

    renderNotificaciones();
    mostrarHoy();
}

document.addEventListener("DOMContentLoaded", () => {
    actualizarBadge();
    verificarAlertasHoy();
});

document.getElementById("btnNotificaciones")
    .addEventListener("click", togglePanel);

document.getElementById("btnAgregarAlerta")
    .addEventListener("click", abrirModalNuevaAlerta);



function abrirModalEditarMovimiento(mov) {
    movimientoEditando = mov;

    document.getElementById("editFecha").value = mov.fecha;
    document.getElementById("editTipo").value = mov.tipo;
    document.getElementById("editMonto").value = mov.monto;
    document.getElementById("editDescripcion").value = mov.descripcion || "";

    document.getElementById("modalEditarMov").classList.add("show");
}

function guardarEdicion() {
    if (!movimientoEditando) return;

    movimientoEditando.fecha =
        document.getElementById("editFecha").value;

    movimientoEditando.tipo =
        document.getElementById("editTipo").value;

    movimientoEditando.monto =
        Number(document.getElementById("editMonto").value);

    movimientoEditando.descripcion =
        document.getElementById("editDescripcion").value;

    localStorage.setItem("movimientos", JSON.stringify(movimientos));

    cerrarModalEditar();
    renderCalendar();
    abrirDetalleDia(movimientoEditando.fecha);
}

function cerrarModalEditar() {
    document.getElementById("modalEditarMov").classList.remove("show");
    movimientoEditando = null;
}

function diasDelMes(year, month) {
    return new Date(year, month + 1, 0).getDate();
}


function obtenerProximoMovimientoFijo() {
    if (movimientosFijos.length === 0) return null;

    const hoy = new Date();
    let candidatos = [];

    movimientosFijos.forEach(m => {
        let year = hoy.getFullYear();
        let month = hoy.getMonth();

        while (true) {
            const diasMes = diasDelMes(year, month);

            // ❗ si el día NO existe en ese mes, saltar
            if (m.dia <= diasMes) {
                const fecha = new Date(year, month, m.dia);

                // solo fechas futuras o hoy
                if (fecha >= hoy) {
                    candidatos.push({
                        ...m,
                        fecha
                    });
                    break;
                }
            }

            // pasar al siguiente mes
            month++;
            if (month > 11) {
                month = 0;
                year++;
            }
        }
    });

    candidatos.sort((a, b) => a.fecha - b.fecha);
    return candidatos[0] || null;
}


function actualizarResumenFijo() {
    const el = document.getElementById("resumenFijo");
    if (!el) return;

    const prox = obtenerProximoMovimientoFijo();

    if (!prox) {
        el.textContent = "Sin movimientos fijos";
        return;
    }

    const fecha = prox.fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short"
    });

    const signo = prox.tipo === "ingreso" ? "+" : "-";

    el.textContent =
        `Mov. fijo: ${fecha} · ${prox.descripcion} (${signo} ${prox.monto.toFixed(2)})`;
}


function agregarMovimientoFijo(dia, tipo, monto, descripcion) {
    movimientosFijos.push({
        id: Date.now(),
        dia,
        tipo,
        monto,
        descripcion
    });

    localStorage.setItem(
        "movimientosFijos",
        JSON.stringify(movimientosFijos)
    );

    actualizarResumenFijo();
}


function abrirModalMovimientoFijo() {
    document.getElementById("modalMovimientoFijo")
        .classList.add("show");
}

function cerrarModalMovimientoFijo() {
    document.getElementById("modalMovimientoFijo")
        .classList.remove("show");

    document.getElementById("fijoDia").value = "";
    document.getElementById("fijoMonto").value = "";
    document.getElementById("fijoDescripcion").value = "";
}

function guardarMovimientoFijo() {
    const dia = Number(document.getElementById("fijoDia").value);
    const tipo = document.getElementById("fijoTipo").value;
    const monto = Number(document.getElementById("fijoMonto").value);
    const descripcion =
        document.getElementById("fijoDescripcion").value.trim();

    if (!dia || dia < 1 || dia > 31 || !monto || !descripcion) {
        mostrarModal(
            "Campos incompletos",
            "Por favor, completa todos los campos."
        );
        return;
    }

    movimientosFijos.push({
        id: Date.now(),
        dia,
        tipo,
        monto,
        descripcion
    });

    localStorage.setItem(
        "movimientosFijos",
        JSON.stringify(movimientosFijos)
    );

    cerrarModalMovimientoFijo();
    actualizarResumenFijo();
}

function ejecutarMovimientosFijosHoy() {
    const hoy = new Date();
    const diaHoy = hoy.getDate();

    const year = hoy.getFullYear();
    const month = hoy.getMonth();

    const claveMes = `${year}-${month}`;
    const keyEjecutados = `fijosEjecutados_${claveMes}`;

    let ejecutados = JSON.parse(localStorage.getItem(keyEjecutados)) || [];

    movimientosFijos.forEach(fijo => {
        if (fijo.dia !== diaHoy) return;

        if (ejecutados.includes(fijo.id)) return;

        if (fijo.dia > diasDelMes(year, month)) return;

        const fechaISO = hoy.toISOString().split("T")[0];

        const movimiento = {
            id: Date.now(),
            fecha: fechaISO,
            tipo: fijo.tipo,
            monto: fijo.monto,
            descripcion: fijo.descripcion + " (fijo)"
        };

        movimientos.push(movimiento);
        ejecutados.push(fijo.id);

        ultimoMovimiento = movimiento;
    });

    if (ejecutados.length > 0) {
        localStorage.setItem("movimientos", JSON.stringify(movimientos));
        localStorage.setItem(keyEjecutados, JSON.stringify(ejecutados));
        renderCalendar();
    }
}



let movimientoEditando = null;


function abrirModalEditarMovimiento(mov) {
    movimientoEditando = mov;

    document.getElementById("editFecha").value = mov.fecha;
    document.getElementById("editTipo").value = mov.tipo;
    document.getElementById("editMonto").value = mov.monto;
    document.getElementById("editDescripcion").value = mov.descripcion || "";

    document.getElementById("modalEditarMov").classList.add("show");
}

function guardarEdicion() {
    if (!movimientoEditando) return;

    movimientoEditando.fecha =
        document.getElementById("editFecha").value;

    movimientoEditando.tipo =
        document.getElementById("editTipo").value;

    movimientoEditando.monto =
        Number(document.getElementById("editMonto").value);

    movimientoEditando.descripcion =
        document.getElementById("editDescripcion").value;

    localStorage.setItem("movimientos", JSON.stringify(movimientos));

    cerrarModalEditar();
    renderCalendar();
    abrirDetalleDia(movimientoEditando.fecha);
}

function cerrarModalEditar() {
    document.getElementById("modalEditarMov").classList.remove("show");
    movimientoEditando = null;
}


/* ===============================
   UTILIDADES
================================*/
function diasDelMes(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/* ===============================
   LISTA EN MODAL
================================*/
function renderListaFijos() {
    const cont = document.getElementById("listaFijos");
    cont.innerHTML = "";

    if (movimientosFijos.length === 0) {
        cont.innerHTML = "<p class='empty'>Sin movimientos fijos</p>";
        return;
    }

    movimientosFijos.forEach(f => {
        const div = document.createElement("div");
        div.className = "fijo-item";

        div.innerHTML = `
            <div>
                <strong>Día ${f.dia}</strong>
                <small>${f.descripcion}</small><br>
                <small>${f.tipo === "ingreso" ? "+" : "-"} S/ ${f.monto.toFixed(2)}</small>
            </div>

            <div class="fijo-actions">
                <button class="delete" onclick="eliminarMovimientoFijo(${f.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        cont.appendChild(div);
    });
}

/* ===============================
   CRUD
================================*/
function guardarMovimientoFijo() {
    const dia = Number(document.getElementById("fijoDia").value);
    const tipo = document.getElementById("fijoTipo").value;
    const monto = Number(document.getElementById("fijoMonto").value);
    const descripcion = document.getElementById("fijoDescripcion").value.trim();

    if (!dia || dia < 1 || dia > 31 || !monto || !descripcion) {
        alert("Completa todos los campos correctamente");
        return;
    }

    movimientosFijos.push({
        id: Date.now(),
        dia,
        tipo,
        monto,
        descripcion
    });

    localStorage.setItem(
        "movimientosFijos",
        JSON.stringify(movimientosFijos)
    );

    document.getElementById("fijoDia").value = "";
    document.getElementById("fijoMonto").value = "";
    document.getElementById("fijoDescripcion").value = "";

    renderListaFijos();
}

function eliminarMovimientoFijo(id) {
    movimientosFijos = movimientosFijos.filter(f => f.id !== id);
    localStorage.setItem(
        "movimientosFijos",
        JSON.stringify(movimientosFijos)
    );
    renderListaFijos();
}

/* ===============================
   MODAL
================================*/
function abrirModalMovimientoFijo() {
    document.getElementById("modalMovimientoFijo").classList.add("show");
    renderListaFijos();
}

function cerrarModalMovimientoFijo() {
    document.getElementById("modalMovimientoFijo").classList.remove("show");
}

/* ===============================
   EJECUCIÓN AUTOMÁTICA
================================*/
function ejecutarMovimientosFijosHoy() {
    const hoy = new Date();
    const diaHoy = hoy.getDate();
    const year = hoy.getFullYear();
    const month = hoy.getMonth();

    const claveMes = `${year}-${month}`;
    const keyEjecutados = `fijosEjecutados_${claveMes}`;

    let ejecutados =
        JSON.parse(localStorage.getItem(keyEjecutados)) || [];

    movimientosFijos.forEach(fijo => {
        if (fijo.dia !== diaHoy) return;
        if (ejecutados.includes(fijo.id)) return;
        if (fijo.dia > diasDelMes(year, month)) return;

        movimientos.push({
            id: Date.now(),
            fecha: hoy.toISOString().split("T")[0],
            tipo: fijo.tipo,
            monto: fijo.monto,
            descripcion: fijo.descripcion + " (fijo)"
        });

        ejecutados.push(fijo.id);
    });

    if (ejecutados.length) {
        localStorage.setItem("movimientos", JSON.stringify(movimientos));
        localStorage.setItem(keyEjecutados, JSON.stringify(ejecutados));
        renderCalendar();
    }
}