const mongoose = require('mongoose');
const Reservation = mongoose.model('Reservation');
const Store = mongoose.model('Store');

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

exports.createReservation = async (req, res) => {
    const { restaurantId, date, timeSlot } = req.body;
    const restaurant = await Store.findById(restaurantId);
    const reservations = await Reservation.find({ restaurant: restaurantId, date, timeSlot });
    console.log(new Date(date).getDay());
    if (restaurant.closedDays.includes(days[new Date(date).getDay()])) {
        req.flash('error', `The restaurant is closed on this day.`);
    } else if (reservations.length >= restaurant.maxReservations) {
        req.flash('error', `The restaurant is fully booked for this time slot.`);
    } else {
        const newReservation = await Reservation.create({
          user: req.user._id,
          restaurant: restaurantId,
          date,
          timeSlot,
        });

        if(!newReservation.isNotExpired()) {
            await Reservation.findByIdAndDelete(newReservation._id);
            req.flash('error', `Reservation is expired.`);
        } else {
            req.flash('success', `Successfully Created Reservation.`);
        }
    }
      res.redirect(`/store/${restaurant.slug}`);
};

exports.deleteReservation = async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    const restaurant = await Store.findById(reservation.restaurant);
  
    if (!reservation) {
        req.flash('error', `Reservation not found.`);
    } else if (reservation.user.toString() !== req.user._id.toString()) {
        req.flash('error', `You are not authorized to delete this reservation.`);
    } else {
        await Reservation.findByIdAndDelete(req.params.id);
        req.flash('success', `Successfully Deleted Reservation.`);
    }
  
    res.redirect('back');
}