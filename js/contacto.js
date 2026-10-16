const CORREO_CONTACTO = 'info@sazon1821.com.pe';

// Sin backend: el mensaje se arma y se abre en la aplicación de correo del visitante
function iniciarContacto() {
    const form = document.querySelector('.contact-form');
    const estado = form.querySelector('.contact-form__status');

    form.addEventListener('input', (event) => {
        event.target.removeAttribute('aria-invalid');
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const invalidos = [...form.elements].filter((campo) => campo.willValidate && !campo.checkValidity());
        form.querySelectorAll('[aria-invalid]').forEach((campo) => campo.removeAttribute('aria-invalid'));
        if (invalidos.length > 0) {
            invalidos.forEach((campo) => campo.setAttribute('aria-invalid', 'true'));
            invalidos[0].focus();
            estado.textContent = 'Completa tu nombre, un correo válido y el mensaje.';
            estado.classList.add('contact-form__status--error');
            return;
        }

        const datos = new FormData(form);
        const asunto = `Contacto web - ${datos.get('nombre')} (${datos.get('sede')})`;
        const cuerpo = [
            datos.get('mensaje'),
            '',
            `Nombre: ${datos.get('nombre')}`,
            `Correo: ${datos.get('correo')}`,
            `Teléfono: ${datos.get('telefono') || '-'}`,
            `Sede: ${datos.get('sede')}`
        ].join('\n');

        window.location.href = `mailto:${CORREO_CONTACTO}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
        estado.textContent = 'Abrimos tu aplicación de correo con el mensaje listo para enviar.';
        estado.classList.remove('contact-form__status--error');
    });
}

document.addEventListener('DOMContentLoaded', iniciarContacto);
