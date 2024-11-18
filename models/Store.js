
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true, // this normalizes names
        required: 'Please enter a store name!' //"name" is mandatory
    },
    slug : String, //this element will be autogenerated
    description: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    tags: [String], //array of strings
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // tell MongoDB the relation with model "User"
        required: 'You must supply an author'
    },
    photo: String
});

storeSchema.virtual('reviews', {
    ref: 'Review', // foreign model -> REVIEW
    //which FIELD on our STORE needs to match up with which field on the foreing model
    localField: '_id',
    foreignField: 'store'
});

function autopopulate(next) {
    this.populate('reviews');
    next();
}
storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

storeSchema.statics.getTagsList = function() {
    return this.aggregate([

        { $unwind: '$tags'},
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ])
}

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        {   $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'store',
                as: 'reviews'
            }
        },
        { $match: {
            'reviews.1': { $exists: true}
            }
        },
        { $addFields: {
            averageRating: {$avg: '$reviews.rating'}
            }
        },
        { $sort: {
            averageRating: -1
            }
        },
        { $limit: 10 }
    ]);
};


// *********INDEXES**********
storeSchema.index({
    name: 'text', //we will search in the name attribute
    description: 'text' //we will search in the desc. attribute
});


// ********PRE-SAVE HOOK********* -
storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next();
        return; //stop this function from running
    }
    this.slug = slug(this.name);

    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
    
    if (storesWithSlug.length) { //if slug exists -> increment
        this.slug = `${this.slug}-${storesWithSlug.length+1}`;
    }

    next(); //follow the PIPELINE -> do the SAVE
});

//link “Store” with the storeSchema and make it importable
module.exports = mongoose.model('Store', storeSchema);