const productos = [
  {
    id: 1,
    nombre: "Cucurucho clásico",
    detalle: "Caja de 120 unidades",
    precio: 1200,
    categoria: "Cucuruchos",
    imagen: "assets/cucurucho-clasico.png",
    link: "https://mpago.la/1oXCuYJ",
    unidad: "caja"
  },
  {
    id: 2,
    nombre: "Cucurucho chico sabor vainilla",
    detalle: "Caja de 300 unidades",
    precio: 1000,
    categoria: "Cucuruchos",
    imagen: "assets/cucurucho-vainilla.png",
    link: "https://mpago.la/23naDqD",
    unidad: "caja"
  },
  {
    id: 3,
    nombre: "Bowl de espuma de 1 L",
    detalle: "Pack de 100 unidades",
    precio: 1000,
    categoria: "Packaging",
    imagen: "assets/bowl-espuma-1l.png",
    link: "https://mpago.la/2LKiT8B",
    unidad: "pack"
  },
  {
    id: 4,
    nombre: "Pack para emprender",
    detalle: "Estamos preparando algo para tu primer paso.",
    categoria: "Packs",
    proximamente: true
  }
];

const seleccionar = (selector) => document.querySelector(selector);

const moneda = (importe) =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0
  }).format(importe);

let carrito = {};
let temporizadorAviso;

try {
  const guardado = JSON.parse(
    localStorage.getItem("sabia-carrito-simple") || "{}"
  );

  if (guardado && typeof guardado === "object") {
    productos.forEach((producto) => {
      const cantidad = guardado[producto.id];

      if (
        !producto.proximamente &&
        Number.isInteger(cantidad) &&
        cantidad > 0 &&
        cantidad <= 100
      ) {
        carrito[producto.id] = cantidad;
      }
    });
  }
} catch {
  carrito = {};
}

function mostrarProductos(categoria = "Todo") {
  const visibles = productos.filter(
    (producto) =>
      categoria === "Todo" || producto.categoria === categoria
  );

  seleccionar("#listaProductos").innerHTML = visibles
    .map((producto) => {
      if (producto.proximamente) {
        return `
          <article class="producto">
            <div class="proximamente">Próximamente ☀</div>
            <h3>${producto.nombre}</h3>
            <p class="detalle">${producto.detalle}</p>
          </article>
        `;
      }

      return `
        <article class="producto">
          <img
            src="${producto.imagen}"
            alt="${producto.nombre}"
            loading="lazy"
          >

          <h3>${producto.nombre}</h3>
          <p class="detalle">${producto.detalle}</p>

          <div class="precio-agregar">
            <strong>${moneda(producto.precio)}</strong>

            <button
              class="agregar"
              data-agregar="${producto.id}"
              aria-label="Agregar ${producto.nombre}"
            >
              Agregar a la bolsa +
            </button>
          </div>

          <a
            class="boton pago-directo"
            href="${producto.link}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Comprar 1 ${producto.unidad} con Mercado Pago ↗
          </a>

          <p class="nota-pago">
            Este link paga una ${producto.unidad === "pack" ? "presentación" : "caja"}
            de este producto. No incluye otros artículos de la bolsa.
            Coordiná la entrega por correo o teléfono.
          </p>
        </article>
      `;
    })
    .join("");
}

function guardarCarrito() {
  try {
    localStorage.setItem(
      "sabia-carrito-simple",
      JSON.stringify(carrito)
    );
  } catch {
    // El carrito sigue funcionando aunque no pueda guardarse.
  }

  actualizarBolsa();
  seleccionar("#datosTransferencia").hidden = true;
}

function calcularTotal() {
  return productos.reduce(
    (total, producto) =>
      total +
      (producto.precio || 0) * (carrito[producto.id] || 0),
    0
  );
}

function agregarProducto(id) {
  const producto = productos.find((item) => item.id === id);

  if (!producto || producto.proximamente) return;

  carrito[id] = Math.min((carrito[id] || 0) + 1, 100);
  guardarCarrito();

  seleccionar("#aviso").textContent = "Lo sumamos a tu bolsa ☀";
  seleccionar("#aviso").classList.add("visible");

  clearTimeout(temporizadorAviso);

  temporizadorAviso = setTimeout(() => {
    seleccionar("#aviso").classList.remove("visible");
  }, 2000);
}

function cambiarCantidad(id, diferencia) {
  carrito[id] = Math.min(
    (carrito[id] || 0) + diferencia,
    100
  );

  if (carrito[id] <= 0) {
    delete carrito[id];
  }

  guardarCarrito();
}

function actualizarBolsa() {
  const elegidos = productos.filter(
    (producto) => carrito[producto.id]
  );

  seleccionar("#cantidadBolsa").textContent =
    Object.values(carrito).reduce(
      (total, cantidad) => total + cantidad,
      0
    );

  seleccionar("#contenidoBolsa").innerHTML = elegidos.length
    ? elegidos
        .map(
          (producto) => `
            <div class="item-bolsa">
              <strong>${producto.nombre}</strong>
              <p class="detalle">${producto.detalle}</p>

              <p>
                ${moneda(producto.precio)} por ${producto.unidad}
              </p>

              <div class="controles">
                <button
                  type="button"
                  data-cambiar="${producto.id}"
                  data-diferencia="-1"
                  aria-label="Quitar una unidad de ${producto.nombre}"
                >−</button>

                <span>${carrito[producto.id]}</span>

                <button
                  type="button"
                  data-cambiar="${producto.id}"
                  data-diferencia="1"
                  aria-label="Agregar una unidad de ${producto.nombre}"
                >+</button>
              </div>
            </div>
          `
        )
        .join("")
    : "<p>Tu bolsa está esperando algo rico.</p>";

  seleccionar("#totalBolsa").textContent =
    moneda(calcularTotal());

  seleccionar("#preparar").disabled = elegidos.length === 0;
}

function actualizarEntrega() {
  const entrega = seleccionar("#entrega").value;
  const necesitaDireccion = entrega !== "Retiro coordinado";
  const otraAgencia = entrega === "Otra agencia";

  seleccionar("#camposDireccion").hidden = !necesitaDireccion;
  seleccionar("#campoAgencia").hidden = !otraAgencia;

  ["departamento", "localidad", "direccion"].forEach((campo) => {
    seleccionar("#" + campo).required = necesitaDireccion;
  });

  seleccionar("#agencia").required = otraAgencia;
  seleccionar("#datosTransferencia").hidden = true;
}

seleccionar("#listaProductos").addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-agregar]");

  if (boton) {
    agregarProducto(Number(boton.dataset.agregar));
  }
});

seleccionar("#contenidoBolsa").addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-cambiar]");

  if (boton) {
    cambiarCantidad(
      Number(boton.dataset.cambiar),
      Number(boton.dataset.diferencia)
    );
  }
});

document.querySelectorAll("[data-categoria]").forEach((boton) => {
  boton.addEventListener("click", () => {
    document.querySelectorAll("[data-categoria]").forEach((otro) => {
      otro.classList.remove("activo");
    });

    boton.classList.add("activo");
    mostrarProductos(boton.dataset.categoria);
  });
});

seleccionar("#abrirBolsa").addEventListener("click", () => {
  actualizarBolsa();
  seleccionar("#bolsa").showModal();
});

seleccionar("#cerrarBolsa").addEventListener("click", () => {
  seleccionar("#bolsa").close();
});

seleccionar("#entrega").addEventListener(
  "change",
  actualizarEntrega
);

seleccionar("#formulario").addEventListener("input", () => {
  seleccionar("#datosTransferencia").hidden = true;
});

seleccionar("#formulario").addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (calcularTotal() <= 0) return;

  const datos = new FormData(evento.target);
  const entrega = datos.get("entrega");

  const lineasProductos = productos
    .filter((producto) => carrito[producto.id])
    .map(
      (producto) =>
        `${carrito[producto.id]} × ${producto.nombre}\n` +
        `${producto.detalle} — ` +
        moneda(producto.precio * carrito[producto.id])
    );

  const lineas = [
    "Hola, quiero coordinar esta compra en SABIÁ:",
    "",
    ...lineasProductos,
    "",
    "TOTAL DE PRODUCTOS: " + moneda(calcularTotal()),
    "",
    "Nombre: " + datos.get("nombre"),
    "Correo: " + datos.get("correo"),
    "Teléfono: " + datos.get("telefono"),
    "Entrega: " +
      (entrega === "Otra agencia" ? datos.get("agencia") : entrega)
  ];

  if (entrega !== "Retiro coordinado") {
    lineas.push(
      "Departamento: " + datos.get("departamento"),
      "Localidad: " + datos.get("localidad"),
      "Dirección: " + datos.get("direccion"),
      "Indicaciones: " + (datos.get("indicaciones") || "—"),
      "Envío a pagar en destino, no incluido en el total."
    );
  }

  lineas.push(
    "",
    "Quiero pagar por transferencia BROU.",
    "Quedo a la espera de coordinar disponibilidad y entrega."
  );

  const resumen = lineas.join("\n");

  seleccionar("#resumen").textContent = resumen;

  seleccionar("#importeTransferencia").textContent =
    moneda(calcularTotal());

  seleccionar("#enviarCorreo").href =
    "mailto:sabrinalop18@gmail.com" +
    "?subject=" + encodeURIComponent("Consulta de compra — SABIÁ") +
    "&body=" + encodeURIComponent(resumen);

  seleccionar("#datosTransferencia").hidden = false;

  seleccionar("#datosTransferencia").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

mostrarProductos();
actualizarBolsa();
actualizarEntrega();