/* ==========================================================================
   carta.js
   Catálogo, filtros, búsqueda, detalles, galería y carrito de consulta.
   ADMINISTRACIÓN MANUAL: edita el arreglo PRODUCTOS de este archivo.
   ========================================================================== */

"use strict";

/* --------------------------------------------------------------------------
   1. CONFIGURACIÓN
   -------------------------------------------------------------------------- */
const WHATSAPP_NUMBER = "573001234567"; // Reemplaza por el número real, con indicativo de país y sin +.
const MONEDA = "COP";

/*
 * Agrega o modifica productos en este arreglo.
 * precio: usa un número cuando tengas el precio confirmado; usa null para
 * mostrar "Consultar precio" y evitar publicar valores inventados.
 * imagenes: rutas relativas desde carta.html. La primera será la imagen principal.
 */
const PRODUCTOS = [
    {
        id: "cerveza-club-colombia",
        nombre: "Club Colombia",
        marca: "Club Colombia",
        categoria: "cervezas",
        presentacion: "Botella · presentación por confirmar",
        descripcion: "Cerveza para disfrutar fría y compartir en buena compañía. Confirma la presentación disponible en la cantina.",
        precio: null,
        imagenes: ["img/productos/cervezas/club-colombia-1.jpg", "img/productos/cervezas/club-colombia-2.jpg"],
        disponible: true,
        etiquetas: ["POPULAR"],
        destacado: true
    },
    {
        id: "cerveza-poker",
        nombre: "Póker",
        marca: "Póker",
        categoria: "cervezas",
        presentacion: "Botella · presentación por confirmar",
        descripcion: "Una opción clásica para acompañar el encuentro con amigos. Consulta disponibilidad y presentación.",
        precio: null,
        imagenes: ["img/productos/cervezas/poker-1.jpg", "img/productos/cervezas/poker-2.jpg"],
        disponible: true,
        etiquetas: [],
        destacado: false
    },
    {
        id: "aguardiente-antioqueno",
        nombre: "Aguardiente Antioqueño",
        marca: "Fábrica de Licores de Antioquia",
        categoria: "aguardientes",
        presentacion: "Botella · presentación por confirmar",
        descripcion: "Un clásico de la región para ocasiones especiales. Consulta las presentaciones disponibles.",
        precio: null,
        imagenes: ["img/productos/aguardientes/antioqueno-1.jpg", "img/productos/aguardientes/antioqueno-2.jpg"],
        disponible: true,
        etiquetas: ["DESTACADO"],
        destacado: true
    },
    {
        id: "ron-medellin",
        nombre: "Ron Medellín",
        marca: "Ron Medellín",
        categoria: "rones",
        presentacion: "Botella · presentación por confirmar",
        descripcion: "Consulta las referencias y presentaciones disponibles en nuestra carta.",
        precio: null,
        imagenes: ["img/productos/rones/ron-medellin-1.jpg"],
        disponible: true,
        etiquetas: [],
        destacado: false
    },
    {
        id: "whisky-referencia",
        nombre: "Whisky (referencia por definir)",
        marca: "Consultar marca",
        categoria: "whiskies",
        presentacion: "Botella · presentación por confirmar",
        descripcion: "Producto de ejemplo. Reemplaza este registro por la marca, descripción y fotografía del whisky que maneja la cantina.",
        precio: null,
        imagenes: ["img/productos/whiskies/whisky-1.jpg"],
        disponible: false,
        etiquetas: ["DEMO"],
        destacado: false
    },
    {
        id: "bebida-sin-alcohol",
        nombre: "Bebida sin alcohol",
        marca: "Varias marcas",
        categoria: "sin-alcohol",
        presentacion: "Presentación por confirmar",
        descripcion: "Espacio de ejemplo para gaseosas, agua, hidratantes u otras bebidas sin alcohol.",
        precio: null,
        imagenes: ["img/productos/sin-alcohol/bebida-1.jpg"],
        disponible: true,
        etiquetas: [],
        destacado: false
    }
];

const NOMBRES_CATEGORIAS = {
    "cervezas": "Cervezas",
    "aguardientes": "Aguardientes",
    "rones": "Rones",
    "whiskies": "Whiskies",
    "vodkas": "Vodkas",
    "tequilas": "Tequilas",
    "cocteles": "Cócteles",
    "sin-alcohol": "Sin alcohol"
};

const estado = {
    categoria: "todas",
    busqueda: "",
    orden: "destacados",
    carrito: new Map(),
    productoModal: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escaparHTML(valor = "") {
    return String(valor).replace(/[&<>"']/g, caracter => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[caracter]);
}

function formatoPrecio(precio) {
    if (typeof precio !== "number" || !Number.isFinite(precio)) return "Consultar precio";
    return new Intl.NumberFormat("es-CO", {
        style: "currency", currency: MONEDA, maximumFractionDigits: 0
    }).format(precio);
}

function productoPorId(id) {
    return PRODUCTOS.find(producto => producto.id === id);
}

function imagenHTML(ruta, nombre, clase = "") {
    if (!ruta) return `<div class="producto-card__placeholder ${clase}" aria-label="Imagen pendiente">✦</div>`;
    return `<img class="${clase}" src="${escaparHTML(ruta)}" alt="${escaparHTML(nombre)}" loading="lazy" onerror="this.hidden=true; this.nextElementSibling.hidden=false">
            <div class="producto-card__placeholder" hidden aria-label="Imagen pendiente">✦</div>`;
}

/* --------------------------------------------------------------------------
   2. RENDERIZADO DEL CATÁLOGO
   -------------------------------------------------------------------------- */
function obtenerProductosFiltrados() {
    let lista = PRODUCTOS.filter(producto => {
        const coincideCategoria = estado.categoria === "todas" || producto.categoria === estado.categoria;
        const termino = estado.busqueda.trim().toLocaleLowerCase("es");
        const coincideBusqueda = !termino ||
            `${producto.nombre} ${producto.marca} ${producto.categoria}`.toLocaleLowerCase("es").includes(termino);
        return coincideCategoria && coincideBusqueda;
    });

    if (estado.orden === "nombre") {
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    } else if (estado.orden === "precio-asc") {
        lista.sort((a, b) => (a.precio ?? Number.MAX_SAFE_INTEGER) - (b.precio ?? Number.MAX_SAFE_INTEGER));
    } else if (estado.orden === "precio-desc") {
        lista.sort((a, b) => (b.precio ?? -1) - (a.precio ?? -1));
    } else {
        lista.sort((a, b) => Number(b.destacado) - Number(a.destacado));
    }
    return lista;
}

function crearTarjeta(producto) {
    const etiquetas = (producto.etiquetas || []).map(etiqueta =>
        `<span class="producto-badge">${escaparHTML(etiqueta)}</span>`
    ).join("");
    const agotado = !producto.disponible;
    const categoria = NOMBRES_CATEGORIAS[producto.categoria] || producto.categoria;

    return `
        <div class="col-6 col-md-4 col-xl-3">
            <article class="producto-card">
                <div class="producto-card__media">
                    ${imagenHTML(producto.imagenes?.[0], producto.nombre)}
                    <div class="producto-badges">
                        ${etiquetas}
                        ${agotado ? '<span class="producto-badge producto-badge--agotado">AGOTADO</span>' : ""}
                    </div>
                </div>
                <div class="producto-card__body">
                    <span class="producto-card__categoria">${escaparHTML(categoria)}</span>
                    <h3 class="producto-card__title">${escaparHTML(producto.nombre)}</h3>
                    <div class="producto-card__meta">${escaparHTML(producto.presentacion || producto.marca || "")}</div>
                    <div class="producto-card__price">${formatoPrecio(producto.precio)}
                        <small>${agotado ? "No disponible por el momento" : "Precio sujeto a confirmación"}</small>
                    </div>
                    <div class="producto-card__actions">
                        <button class="btn btn-ver-detalle" type="button" data-action="detalle" data-id="${escaparHTML(producto.id)}">Ver detalles</button>
                        <button class="btn btn-agregar" type="button" data-action="agregar" data-id="${escaparHTML(producto.id)}" ${agotado ? "disabled" : ""}>${agotado ? "No disponible" : "Agregar +"}</button>
                    </div>
                </div>
            </article>
        </div>`;
}

function renderizarCatalogo() {
    const productos = obtenerProductosFiltrados();
    const grid = $("#productosGrid");
    grid.innerHTML = productos.map(crearTarjeta).join("");

    $("#contadorResultados").textContent =
        `${productos.length} ${productos.length === 1 ? "producto encontrado" : "productos encontrados"}`;
    $("#estadoVacio").classList.toggle("d-none", productos.length !== 0);
    grid.classList.toggle("d-none", productos.length === 0);
}

/* --------------------------------------------------------------------------
   3. FILTROS, BÚSQUEDA Y ORDEN
   -------------------------------------------------------------------------- */
function configurarFiltros() {
    $("#filtrosCategorias").addEventListener("click", evento => {
        const boton = evento.target.closest("[data-category]");
        if (!boton) return;
        estado.categoria = boton.dataset.category;
        $$(".categoria-chip").forEach(chip => {
            const activo = chip === boton;
            chip.classList.toggle("is-active", activo);
            chip.setAttribute("aria-pressed", String(activo));
        });
        renderizarCatalogo();
    });

    $("#buscadorProductos").addEventListener("input", evento => {
        estado.busqueda = evento.target.value;
        $("#limpiarBusqueda").hidden = !estado.busqueda;
        renderizarCatalogo();
    });

    $("#limpiarBusqueda").addEventListener("click", () => {
        $("#buscadorProductos").value = "";
        estado.busqueda = "";
        $("#limpiarBusqueda").hidden = true;
        renderizarCatalogo();
        $("#buscadorProductos").focus();
    });

    $("#ordenProductos").addEventListener("change", evento => {
        estado.orden = evento.target.value;
        renderizarCatalogo();
    });

    const restablecer = () => {
        estado.categoria = "todas";
        estado.busqueda = "";
        estado.orden = "destacados";
        $("#buscadorProductos").value = "";
        $("#ordenProductos").value = "destacados";
        $("#limpiarBusqueda").hidden = true;
        $$(".categoria-chip").forEach(chip => {
            const activo = chip.dataset.category === "todas";
            chip.classList.toggle("is-active", activo);
            chip.setAttribute("aria-pressed", String(activo));
        });
        renderizarCatalogo();
    };

    $("#restablecerFiltros").addEventListener("click", restablecer);
    $("#verTodosProductos").addEventListener("click", restablecer);
}

/* --------------------------------------------------------------------------
   4. MODAL Y GALERÍA DEL PRODUCTO
   -------------------------------------------------------------------------- */
function abrirDetalle(id) {
    const producto = productoPorId(id);
    if (!producto) return;
    estado.productoModal = producto;

    const imagenes = producto.imagenes?.length ? producto.imagenes : [];
    const principal = imagenes[0] || "";
    const thumbs = imagenes.map((ruta, indice) => `
        <button class="detalle-thumb ${indice === 0 ? "is-active" : ""}" type="button"
            data-gallery-image="${escaparHTML(ruta)}" aria-label="Ver imagen ${indice + 1}">
            <img src="${escaparHTML(ruta)}" alt="" loading="lazy">
        </button>`).join("");

    $("#modalProductoContenido").innerHTML = `
        <div class="detalle-producto">
            <div class="detalle-galeria">
                <div class="detalle-galeria__principal">
                    ${principal
                        ? `<img id="imagenDetallePrincipal" src="${escaparHTML(principal)}" alt="${escaparHTML(producto.nombre)}" onerror="this.hidden=true; this.nextElementSibling.hidden=false">
                           <div class="producto-card__placeholder" hidden>✦</div>`
                        : `<div class="producto-card__placeholder">✦</div>`}
                </div>
                ${imagenes.length > 1 ? `<div class="detalle-galeria__thumbs">${thumbs}</div>` : ""}
            </div>
            <div class="detalle-info">
                <span class="producto-card__categoria">${escaparHTML(NOMBRES_CATEGORIAS[producto.categoria] || producto.categoria)}</span>
                <h3 class="mt-2" id="modalProductoTitulo">${escaparHTML(producto.nombre)}</h3>
                <div class="detalle-presentacion">${escaparHTML(producto.marca || "")} · ${escaparHTML(producto.presentacion || "")}</div>
                <div class="detalle-precio">${formatoPrecio(producto.precio)}</div>
                <p>${escaparHTML(producto.descripcion || "Consulta más información sobre este producto.")}</p>
                <p class="small">${producto.disponible ? "Disponibilidad por confirmar con la cantina." : "Este producto aparece temporalmente como no disponible."}</p>
                <button class="btn btn-carta-principal w-100 mt-2" type="button" data-action="agregar-modal" data-id="${escaparHTML(producto.id)}" ${!producto.disponible ? "disabled" : ""}>Agregar a mi pedido</button>
            </div>
        </div>`;

    bootstrap.Modal.getOrCreateInstance($("#modalProducto")).show();
}

function configurarGaleriaModal() {
    $("#modalProductoContenido").addEventListener("click", evento => {
        const thumb = evento.target.closest("[data-gallery-image]");
        if (!thumb) return;
        const imagen = $("#imagenDetallePrincipal");
        if (imagen) {
            imagen.src = thumb.dataset.galleryImage;
            imagen.hidden = false;
            const placeholder = imagen.nextElementSibling;
            if (placeholder) placeholder.hidden = true;
        }
        $$(".detalle-thumb").forEach(item => item.classList.toggle("is-active", item === thumb));
    });
}

/* --------------------------------------------------------------------------
   5. CARRITO
   -------------------------------------------------------------------------- */
function agregarAlCarrito(id) {
    const producto = productoPorId(id);
    if (!producto || !producto.disponible) return;
    const actual = estado.carrito.get(id) || 0;
    estado.carrito.set(id, actual + 1);
    renderizarCarrito();
    const panel = bootstrap.Offcanvas.getOrCreateInstance($("#panelCarrito"));
    panel.show();
}

function cambiarCantidad(id, diferencia) {
    const cantidad = (estado.carrito.get(id) || 0) + diferencia;
    if (cantidad <= 0) estado.carrito.delete(id);
    else estado.carrito.set(id, cantidad);
    renderizarCarrito();
}

function eliminarDelCarrito(id) {
    estado.carrito.delete(id);
    renderizarCarrito();
}

function renderizarCarrito() {
    const contenido = $("#carritoContenido");
    const entradas = [...estado.carrito.entries()];
    const totalUnidades = entradas.reduce((suma, [, cantidad]) => suma + cantidad, 0);
    $$("[data-cart-count]").forEach(elemento => elemento.textContent = totalUnidades);

    if (entradas.length === 0) {
        contenido.innerHTML = `<div class="carrito-vacio"><div><span>＋</span><strong>Tu pedido está vacío</strong><small>Agrega productos de la carta para comenzar.</small></div></div>`;
        $("#carritoSubtotal").textContent = "Por confirmar";
        $("#enviarPedido").disabled = true;
        return;
    }

    let subtotal = 0;
    let preciosCompletos = true;

    contenido.innerHTML = entradas.map(([id, cantidad]) => {
        const producto = productoPorId(id);
        if (!producto) return "";
        if (typeof producto.precio === "number") subtotal += producto.precio * cantidad;
        else preciosCompletos = false;

        return `
            <div class="carrito-item">
                <div class="carrito-item__img">
                    ${producto.imagenes?.[0]
                        ? `<img src="${escaparHTML(producto.imagenes[0])}" alt="" onerror="this.style.display='none'">`
                        : "✦"}
                </div>
                <div>
                    <div class="carrito-item__name">${escaparHTML(producto.nombre)}</div>
                    <div class="carrito-item__price">${formatoPrecio(producto.precio)}</div>
                    <div class="carrito-quantity">
                        <button type="button" data-cart-action="menos" data-id="${escaparHTML(id)}" aria-label="Disminuir cantidad">−</button>
                        <span>${cantidad}</span>
                        <button type="button" data-cart-action="mas" data-id="${escaparHTML(id)}" aria-label="Aumentar cantidad">+</button>
                    </div>
                </div>
                <button class="carrito-item__remove" type="button" data-cart-action="eliminar" data-id="${escaparHTML(id)}" aria-label="Eliminar ${escaparHTML(producto.nombre)}">×</button>
            </div>`;
    }).join("");

    $("#carritoSubtotal").textContent = preciosCompletos ? formatoPrecio(subtotal) : "Por confirmar";
    $("#enviarPedido").disabled = false;
}

function enviarPedidoWhatsApp() {
    const entradas = [...estado.carrito.entries()];
    if (!entradas.length) return;

    const lineas = entradas.map(([id, cantidad]) => {
        const producto = productoPorId(id);
        return `• ${producto.nombre} x${cantidad} — ${formatoPrecio(producto.precio)}`;
    });

    const mensaje = [
        "Hola, Cantina Los Recuerdos de Ella. Quiero consultar y realizar este pedido:",
        "",
        ...lineas,
        "",
        "Por favor, confirmen disponibilidad, precios finales y condiciones de entrega. ¡Gracias!"
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
}

function configurarCarrito() {
    $("#carritoContenido").addEventListener("click", evento => {
        const boton = evento.target.closest("[data-cart-action]");
        if (!boton) return;
        const { id } = boton.dataset;
        if (boton.dataset.cartAction === "mas") cambiarCantidad(id, 1);
        if (boton.dataset.cartAction === "menos") cambiarCantidad(id, -1);
        if (boton.dataset.cartAction === "eliminar") eliminarDelCarrito(id);
    });

    $("#enviarPedido").addEventListener("click", enviarPedidoWhatsApp);
    $("#vaciarCarrito").addEventListener("click", () => {
        estado.carrito.clear();
        renderizarCarrito();
    });
}

/* --------------------------------------------------------------------------
   6. EVENTOS GENERALES Y ARRANQUE
   -------------------------------------------------------------------------- */
function configurarAccionesCatalogo() {
    $("#productosGrid").addEventListener("click", evento => {
        const boton = evento.target.closest("[data-action]");
        if (!boton) return;
        const id = boton.dataset.id;
        if (boton.dataset.action === "detalle") abrirDetalle(id);
        if (boton.dataset.action === "agregar") agregarAlCarrito(id);
    });

    $("#modalProductoContenido").addEventListener("click", evento => {
        const boton = evento.target.closest('[data-action="agregar-modal"]');
        if (!boton) return;
        const id = boton.dataset.id;
        bootstrap.Modal.getOrCreateInstance($("#modalProducto")).hide();
        agregarAlCarrito(id);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderizarCatalogo();
    renderizarCarrito();
    configurarFiltros();
    configurarGaleriaModal();
    configurarAccionesCatalogo();
    configurarCarrito();
});
