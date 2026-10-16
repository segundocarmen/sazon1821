// Galería: la miniatura elegida pasa a la foto principal
function iniciarGaleria() {
    const principal = document.querySelector('.dish-gallery__main');
    const miniaturas = document.querySelectorAll('.dish-gallery__thumb');

    miniaturas.forEach((boton) => {
        boton.addEventListener('click', () => {
            const foto = boton.querySelector('img');
            principal.src = foto.src;
            principal.alt = foto.alt;
            miniaturas.forEach((otro) => {
                otro.classList.toggle('active', otro === boton);
                otro.setAttribute('aria-pressed', otro === boton);
            });
        });
    });
}

function iniciarFormulario() {
    const form = document.querySelector('.dish-form');
    const precio = Number(form.dataset.precio);
    const cantidad = form.querySelector('.dish-form__quantity > input');
    const total = form.querySelector('.dish-form__total > strong');
    const nota = form.querySelector('.dish-form__textarea');
    const contador = form.querySelector('.dish-form__counter');
    const enviar = form.querySelector('.dish-form__submit');

    function actualizarTotal() {
        total.textContent = formatearPrecio(precio * Number(cantidad.value));
    }

    form.querySelectorAll('[data-paso]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const valor = Number(cantidad.value) + Number(boton.dataset.paso);
            cantidad.value = Math.min(Math.max(valor, Number(cantidad.min)), Number(cantidad.max));
            actualizarTotal();
        });
    });

    nota.addEventListener('input', () => {
        contador.textContent = `${nota.value.length}/${nota.maxLength}`;
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const items = leerCarrito();
        const notaLimpia = nota.value.trim();
        // Mismo plato con la misma nota: se suman las unidades en vez de crear otra línea
        const existente = items.find((item) => item.plato === form.dataset.plato && item.nota === notaLimpia);
        if (existente) {
            existente.cantidad += Number(cantidad.value);
        } else {
            items.push({
                plato: form.dataset.plato,
                nombre: form.dataset.nombre,
                nota: notaLimpia,
                precioUnitario: precio,
                cantidad: Number(cantidad.value)
            });
        }
        guardarCarrito(items);

        enviar.textContent = '¡Agregado al carrito!';
        enviar.disabled = true;
        setTimeout(() => {
            enviar.textContent = 'Agregar al carrito';
            enviar.disabled = false;
        }, 1500);
    });

    actualizarTotal();
}

document.addEventListener('DOMContentLoaded', () => {
    iniciarGaleria();
    iniciarFormulario();
});
