const CARRITO_KEY = 'sazon1821-carrito';

// El almacenamiento puede no estar disponible (modo privado, datos bloqueados)
function leerCarrito() {
    try {
        return JSON.parse(localStorage.getItem(CARRITO_KEY)) || [];
    } catch {
        return [];
    }
}

function guardarCarrito(items) {
    try {
        localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
    } catch {
        // Sin almacenamiento el carrito solo vive en esta visita
    }
    actualizarContadorCarrito(items);
}

function formatearPrecio(monto) {
    return `S/ ${monto}`;
}

// El contador muestra cuántos platos distintos hay; las unidades se ven en el detalle del carrito
function actualizarContadorCarrito(items = leerCarrito()) {
    const total = new Set(items.map((item) => item.plato)).size;
    document.querySelectorAll('.site-header__cart-count').forEach((el) => {
        el.textContent = total > 0 ? total : '';
    });
}

document.addEventListener('DOMContentLoaded', () => actualizarContadorCarrito());

// Mantiene el contador al día si el carrito cambia en otra pestaña
window.addEventListener('storage', (event) => {
    if (event.key === CARRITO_KEY) actualizarContadorCarrito();
});

// sw.js se resuelve desde la ubicación de este script para que funcione también en platos/
if ('serviceWorker' in navigator) {
    const swUrl = new URL('../sw.js', document.currentScript.src);
    window.addEventListener('load', () => navigator.serviceWorker.register(swUrl).catch(() => {}));
}
