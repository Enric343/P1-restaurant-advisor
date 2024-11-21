import typeAhead from './modules/typeAhead';

document.addEventListener('DOMContentLoaded', () => {
    typeAhead(document.querySelector('.form-inline')); // Hago esto porque sinó no iba
});

