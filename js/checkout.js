const COSTO_DELIVERY = 5;
const DEMORA_PAGO_MS = 1800;

// Tarjetas de prueba: esta termina en rechazo, cualquier otra válida se aprueba
const TARJETA_RECHAZADA = '4000000000000002';

const MARCAS = [
    ['Visa', /^4/],
    ['Mastercard', /^(5[1-5]|2[2-7])/],
    ['American Express', /^3[47]/],
    ['Diners Club', /^3(0[0-5]|[68])/]
];

function soloDigitos(texto) {
    return texto.replace(/\D/g, '');
}

function detectarMarca(numero) {
    const marca = MARCAS.find(([, patron]) => patron.test(numero));
    return marca ? marca[0] : '';
}

// Algoritmo de Luhn: el mismo dígito verificador que usan las tarjetas reales
function pasaLuhn(numero) {
    let suma = 0;
    [...numero].reverse().forEach((caracter, i) => {
        let digito = Number(caracter);
        if (i % 2 === 1) {
            digito *= 2;
            if (digito > 9) digito -= 9;
        }
        suma += digito;
    });
    return suma % 10 === 0;
}

function formatearTarjeta(numero) {
    // American Express se agrupa 4-6-5; el resto, de 4 en 4
    if (detectarMarca(numero) === 'American Express') {
        return [numero.slice(0, 4), numero.slice(4, 10), numero.slice(10, 15)].filter(Boolean).join(' ');
    }
    return numero.slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function vencimientoValido(texto) {
    const coincidencia = /^(\d{2})\/(\d{2})$/.exec(texto);
    if (!coincidencia) return false;
    const mes = Number(coincidencia[1]);
    const anio = 2000 + Number(coincidencia[2]);
    if (mes < 1 || mes > 12) return false;
    const hoy = new Date();
    return anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes >= hoy.getMonth() + 1);
}

function iniciarCheckout() {
    const modal = document.getElementById('checkout');
    const form = modal.querySelector('.checkout-form');
    const exito = modal.querySelector('.checkout-success');
    const error = modal.querySelector('.checkout__error');
    const enviar = modal.querySelector('.checkout__submit');
    const lista = modal.querySelector('.checkout-summary__list');
    const campoTarjeta = form.elements.tarjeta;
    const campoVencimiento = form.elements.vencimiento;
    const campoCvv = form.elements.cvv;
    const marca = modal.querySelector('.checkout__brand');

    const valor = (nombre) => form.querySelector(`[name="${nombre}"]:checked`).value;

    function calcularTotales() {
        const subtotal = leerCarrito().reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0);
        const delivery = valor('entrega') === 'delivery' ? COSTO_DELIVERY : 0;
        return { subtotal, delivery, total: subtotal + delivery };
    }

    function actualizarResumen() {
        const { subtotal, delivery, total } = calcularTotales();
        modal.querySelector('.checkout-summary__subtotal').textContent = formatearPrecio(subtotal);
        modal.querySelector('.checkout-summary__delivery').textContent = delivery ? formatearPrecio(delivery) : 'Gratis';
        modal.querySelector('.checkout-summary__total-amount').textContent = formatearPrecio(total);
        enviar.textContent = valor('pago') === 'tarjeta' ? `Pagar ${formatearPrecio(total)}` : 'Confirmar pedido';
    }

    function pintarLista() {
        lista.replaceChildren(...leerCarrito().map((item) => {
            const fila = document.createElement('li');
            fila.className = 'checkout-summary__item';
            fila.innerHTML = '<span class="checkout-summary__name"></span><span class="checkout-summary__price"></span>';
            fila.querySelector('.checkout-summary__name').textContent = `${item.cantidad} × ${item.nombre}`;
            fila.querySelector('.checkout-summary__price').textContent = formatearPrecio(item.precioUnitario * item.cantidad);
            return fila;
        }));
    }

    // Muestra solo los campos de la opción elegida y solo esos se validan
    function mostrarOpciones() {
        ['entrega', 'pago'].forEach((grupo) => {
            const elegido = valor(grupo);
            form.querySelectorAll(`[data-${grupo}]`).forEach((bloque) => {
                const activo = bloque.dataset[grupo] === elegido;
                bloque.hidden = !activo;
                bloque.querySelectorAll('input').forEach((campo) => { campo.disabled = !activo; });
            });
        });
        actualizarResumen();
    }

    function marcar(campo, valido) {
        campo.classList.toggle('is-invalid', !valido);
        return valido;
    }

    function validar() {
        const tarjeta = soloDigitos(campoTarjeta.value);
        const reglas = [
            [form.elements.nombre, form.elements.nombre.value.trim().length >= 3],
            [form.elements.telefono, /^9\d{8}$/.test(soloDigitos(form.elements.telefono.value))],
            [form.elements.direccion, form.elements.direccion.value.trim().length >= 8],
            [campoTarjeta, tarjeta.length >= 13 && pasaLuhn(tarjeta)],
            [form.elements.titular, form.elements.titular.value.trim().length >= 3],
            [campoVencimiento, vencimientoValido(campoVencimiento.value)],
            [campoCvv, new RegExp(`^\\d{${detectarMarca(tarjeta) === 'American Express' ? 4 : 3}}$`).test(campoCvv.value)]
        ];
        const invalidos = reglas.filter(([campo, valido]) => !campo.disabled && !marcar(campo, valido));
        if (invalidos.length > 0) invalidos[0][0].focus();
        return invalidos.length === 0;
    }

    function mostrarError(texto) {
        error.textContent = texto;
        error.hidden = !texto;
    }

    function reiniciar() {
        form.reset();
        form.hidden = false;
        exito.hidden = true;
        enviar.disabled = false;
        marca.textContent = '';
        form.querySelectorAll('.is-invalid').forEach((campo) => campo.classList.remove('is-invalid'));
        mostrarError('');
        mostrarOpciones();
    }

    campoTarjeta.addEventListener('input', () => {
        const numero = soloDigitos(campoTarjeta.value);
        campoTarjeta.value = formatearTarjeta(numero);
        marca.textContent = detectarMarca(numero);
    });

    campoVencimiento.addEventListener('input', (event) => {
        const digitos = soloDigitos(campoVencimiento.value).slice(0, 4);
        // Al borrar no se vuelve a poner la barra, para que se pueda corregir el mes
        campoVencimiento.value = digitos.length > 2 || (digitos.length === 2 && event.inputType !== 'deleteContentBackward')
            ? `${digitos.slice(0, 2)}/${digitos.slice(2)}`
            : digitos;
    });

    campoCvv.addEventListener('input', () => {
        campoCvv.value = soloDigitos(campoCvv.value);
    });

    form.addEventListener('input', (event) => {
        event.target.classList.remove('is-invalid');
        mostrarError('');
    });

    form.addEventListener('change', (event) => {
        if (['entrega', 'pago'].includes(event.target.name)) mostrarOpciones();
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        mostrarError('');
        if (!validar()) return;

        const pagoConTarjeta = valor('pago') === 'tarjeta';
        const textoBoton = enviar.textContent;
        enviar.disabled = true;
        enviar.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Procesando…';

        // Simulación de la pasarela: no se envía ni se guarda ningún dato de la tarjeta
        setTimeout(() => {
            if (pagoConTarjeta && soloDigitos(campoTarjeta.value) === TARJETA_RECHAZADA) {
                enviar.disabled = false;
                enviar.textContent = textoBoton;
                mostrarError('Tu banco rechazó el pago. Prueba con otra tarjeta o elige pago al recibir.');
                return;
            }

            const entrega = valor('entrega');
            const numero = `S1821-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;
            modal.querySelector('.checkout-success__number').textContent = numero;
            modal.querySelector('.checkout-success__text').textContent = entrega === 'delivery'
                ? `Tu pedido llegará en unos 45 minutos a ${form.elements.direccion.value.trim()}.`
                : `Podrás recogerlo en unos 30 minutos en nuestra sede ${form.elements.sede.value}.`;

            guardarCarrito([]);
            document.dispatchEvent(new CustomEvent('carrito:actualizado'));
            form.hidden = true;
            exito.hidden = false;
            exito.querySelector('a').focus();
        }, DEMORA_PAGO_MS);
    });

    modal.addEventListener('show.bs.modal', () => {
        pintarLista();
        reiniciar();
    });

    // Al cerrar se borran los datos de la tarjeta del formulario
    modal.addEventListener('hidden.bs.modal', reiniciar);
}

document.addEventListener('DOMContentLoaded', iniciarCheckout);
