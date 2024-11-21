const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    timeSlot: {
        type: String,
        required: true,
    },
});

reservationSchema.methods.getStore = async function () {
    return mongoose.model('Store').findById(this.restaurant);
};

reservationSchema.methods.isNotExpired = function () {
    const today = new Date();
    
    const endTime = this.timeSlot.split('-')[1].split(':');
    today.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0, 0); // Convertir a enteros con parseInt

    // Compara la fecha completa
    return this.date >= today;
};


reservationSchema.statics.findNotExpired = function (user, restaurant) {
    // Obtener la fecha de hoy sin la hora
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.find({
        user: user,
        restaurant: restaurant,
        date: { $gte: today }, // Busca reservas desde hoy en adelante
    });
};

module.exports = mongoose.model('Reservation', reservationSchema);