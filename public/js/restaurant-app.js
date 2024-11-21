import typeAhead from './modules/typeAhead';

$(document).ready(function() {
    typeAhead(document.querySelector('.form-inline')); // Hago esto porque sinó no iba

    $('.select2').select2({
        placeholder: "Select time slots",  // Placeholder para el select
        allowClear: true                   // Opción para limpiar selección
    });
});

