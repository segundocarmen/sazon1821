const CANTIDAD_MAXIMA = 99;

function crearFila(item) {
    const fila = document.createElement('tr');
    fila.className = 'cart-table__row';
    fila.innerHTML = `
        <td class="cart-table__dish">
            <a class="cart-table__link">
                <img class="cart-table__image" alt="" width="64" height="64">
                <span>
                    <strong class="cart-table__name"></strong>
                    <small class="cart-table__note"></small>
                </span>
            </a>
        </td>
        <td class="cart-table__price" data-label="Precio"></td>
        <td data-label="Cantidad">
            <input type="number" class="cart-table__quantity" min="1" max="${CANTIDAD_MAXIMA}" inputmode="numeric">
        </td>
        <td class="cart-table__subtotal" data-label="Subtotal"></td>
        <td class="cart-table__actions">
            <button type="button" class="cart-table__remove">Quitar</button>
        </td>`;

    // Los datos vienen de localStorage: se asignan como texto, nunca como HTML
    fila.querySelector('.cart-table__link').href = `platos/carta-${item.plato}`;
    fila.querySelector('.cart-table__image').src = `img/platos/${item.plato}/principal.webp`;
    fila.querySelector('.cart-table__name').textContent = item.nombre;
    fila.querySelector('.cart-table__note').textContent = item.nota ? `Nota: ${item.nota}` : '';
    fila.querySelector('.cart-table__price').textContent = formatearPrecio(item.precioUnitario);
    fila.querySelector('.cart-table__subtotal').textContent = formatearPrecio(item.precioUnitario * item.cantidad);
    const cantidad = fila.querySelector('.cart-table__quantity');
    cantidad.value = item.cantidad;
    cantidad.setAttribute('aria-label', `Cantidad de ${item.nombre}`);
    fila.querySelector('.cart-table__remove').setAttribute('aria-label', `Quitar ${item.nombre}`);
    return fila;
}

function iniciarCarrito() {
    const contenido = document.querySelector('.cart__content');
    const vacio = document.querySelector('.cart-empty');
    const cuerpo = document.querySelector('.cart-table__body');
    const total = document.querySelector('.cart-table__total');
    let items = leerCarrito();

    function actualizarTotal() {
        total.textContent = formatearPrecio(items.reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0));
    }

    function render() {
        contenido.hidden = items.length === 0;
        vacio.hidden = items.length > 0;
        cuerpo.replaceChildren(...items.map(crearFila));
        actualizarTotal();
    }

    // Mientras se escribe se actualiza sin redibujar, para no perder el foco del input
    cuerpo.addEventListener('input', (event) => {
        if (!event.target.matches('.cart-table__quantity')) return;
        const fila = event.target.closest('tr');
        const item = items[[...cuerpo.children].indexOf(fila)];
        const valor = Number(event.target.value);
        if (!Number.isInteger(valor) || valor < 1 || valor > CANTIDAD_MAXIMA) return;
        item.cantidad = valor;
        fila.querySelector('.cart-table__subtotal').textContent = formatearPrecio(item.precioUnitario * valor);
        actualizarTotal();
        guardarCarrito(items);
    });

    // Al salir del input se corrige cualquier valor fuera de rango
    cuerpo.addEventListener('change', (event) => {
        if (!event.target.matches('.cart-table__quantity')) return;
        const item = items[[...cuerpo.children].indexOf(event.target.closest('tr'))];
        event.target.value = item.cantidad;
    });

    cuerpo.addEventListener('click', (event) => {
        if (!event.target.matches('.cart-table__remove')) return;
        items.splice([...cuerpo.children].indexOf(event.target.closest('tr')), 1);
        guardarCarrito(items);
        render();
    });

    document.querySelector('.cart__clear').addEventListener('click', () => {
        items = [];
        guardarCarrito(items);
        render();
    });

    // Si el carrito cambia en otra pestaña, se vuelve a leer
    window.addEventListener('storage', (event) => {
        if (event.key !== CARRITO_KEY) return;
        items = leerCarrito();
        render();
    });

    // El checkout avisa cuando confirma un pedido y vacía el carrito
    document.addEventListener('carrito:actualizado', () => {
        items = leerCarrito();
        render();
    });

    render();
}

document.addEventListener('DOMContentLoaded', iniciarCarrito);
