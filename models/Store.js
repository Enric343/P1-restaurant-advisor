const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true, // normalitza el nom
        required: 'Please enter a store name!' //"name" és obligatori
    },
    slug: String, // aquest element es generarà automàticament
    description: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    tags: [String], // array de strings
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // relació amb el model "User"
        required: 'You must supply an author'
    },
    photo: String,
    // Nous camps per al sistema de reserves
    closedDays: {
        type: [String], // Ex.: ['Monday', 'Tuesday']
        default: [] // Inicialment, cap dia tancat
    },
    timeSlots: {
        type: [String], // Ex.: ['12:00-14:00', '14:00-16:00']
        default: [] // Inicialment, sense franges horàries
    },
    maxReservations: {
        type: Number, // Ex.: 10 reserves màximes per franja horària
        default: 10 // Valor predeterminat
    }
});

// Virtual per les reviews
storeSchema.virtual('reviews', {
    ref: 'Review', // model estranger -> REVIEW
    localField: '_id',
    foreignField: 'store'
});

// Funció per autopoblar les reviews
function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

// Mètode per obtenir la valoració mitjana
storeSchema.methods.getAverageRating = async function () {
    const reviews = await mongoose.model('Review').find({ store: this._id });

    if (reviews.length === 0) return 0;

    // Calcula la mitjana de les valoracions
    return reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
};

storeSchema.methods.getReservationsByDateAndTimeSlot = async function (date, timeSlot) {
    return await mongoose.model('Reservation').find({ store: this._id, date: date, timeSlot: timeSlot });
};

// Agregació per obtenir la llista de tags
storeSchema.statics.getTagsList = function () {
    return this.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
};

// Agregació per obtenir els millors restaurants
storeSchema.statics.getTopStores = function () {
    return this.aggregate([
        {
            $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'store',
                as: 'reviews'
            }
        },
        {
            $match: {
                'reviews.1': { $exists: true }
            }
        },
        {
            $addFields: {
                averageRating: { $avg: '$reviews.rating' },
                reviewCount: { $size: '$reviews' }
            }
        },
        {
            $sort: {
                averageRating: -1
            }
        },
        { $limit: 10 }
    ]);
};

// Agregació per obtenir els millors restaurants de l'usuari
storeSchema.statics.getUserTopStores = async function (uid) {
    const stores = await mongoose.model('Store').find();
    const topStores = [];

    stores.forEach((store) => {
        let count = 0;
        let totalRating = 0;
        store.reviews.forEach((review) => {
            if (review.author._id.toString() === uid) {
                count++;
                totalRating += review.rating;
            }
        });

        if (count != 0) {
            store.averageRating = (totalRating / count).toFixed(1);
            store.reviewCount = count;
            topStores.push(store);
        }
    });

    topStores.sort((s1, s2) => s2.averageRating - s1.averageRating);
    return topStores;
};

// Indexos per cerca de text
storeSchema.index({
    name: 'text', // cerca pel nom
    description: 'text' // cerca per descripció
});

// Pre-save hook per generar slugs
storeSchema.pre('save', async function (next) {
    if (!this.isModified('name')) {
        next();
        return; // para aquesta funció si el nom no ha canviat
    }
    this.slug = slug(this.name);

    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });

    if (storesWithSlug.length) { // si el slug existeix -> incrementa'l
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }

    next(); // segueix el pipeline -> guarda
});

// Enllaça el model "Store" amb l'esquema
module.exports = mongoose.model('Store', storeSchema);