
const multer = require('multer');
const uuid = require('uuid');
const { Jimp } = require('jimp');
const mongoose = require('mongoose');
const { timeSlots } = require('../helpers');
const Reservation = mongoose.model('Reservation');
const Store = mongoose.model('Store');


exports.homePage = (req, res) => {
    req.flash('error', `hola <strong>que</strong> tal`);
    req.flash('info', `hola`);
    req.flash('warning', `hola`);
    req.flash('success', `hola`);

    res.render('extendingLayout');  
};

exports.addStore = (req, res) => {
    //same template is used to create and to edit
    res.render('editStore', { title: 'Add Store', timeSlots: res.locals.h.timeSlots });
};

exports.createStore = async (req, res) => {
    //add the id of authenticated user
    req.body.author = req.user._id;

    const store = new Store(req.body);
    const savedStore = await store.save();

    req.flash('success', `Successfully Created ${store.name}.`);
    res.redirect(`/store/${savedStore.slug}`);
};

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: function(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true); //1st value is provided in case of error.
        } else {
            next({ message: 'That filetype isn\'t allowed'}, false);
        }
    }
};

//MIDLEWARE FUNCTION for CREATE STORE
exports.verify = multer(multerOptions).single('photo');

//MIDLEWARE FUNCTION for CREATE STORE
exports.upload = async (req, res, next) => {
    //check if there is no new file to resize
    if (!req.file) {
        next(); // no file -> do nothing and go to next middleware
        return;
    }

    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;

    //now we resize and write in hard-drive
    const photo = await Jimp.read(req.file.buffer);
    photo.resize({ w: 800, h: Jimp.AUTO }); //width=800, height=AUTO
    await photo.write(`./public/uploads/${req.body.photo}`);

    //photo saved in file system, keep going with the PIPELINE
    next();
};

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug });
    
    // If no store -> DB send a NULL -> do nothing and follow the pipeline
    if (!store) {
        next();
        return;
    }

    let rating = await store.getAverageRating();

    let reservations = [];
    if (req.user) {
        reservations = await Reservation.findNotExpired(req.user._id,  store._id );
        reservations.sort((a, b) => a.date - b.date);
        console.log(reservations);
    }
    
    res.render('store', { title: store.name, store: store, rating: rating,  reservations: reservations });
};

exports.getStores = async (req, res) => {
    const stores = await Store.find();
    res.render('stores', {title: 'Stores', stores: stores});
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    res.render('topStores', { stores, topType: 'Global Top', title: 'Global Top Stores'});
};

exports.getUserTopStores = async (req, res) => {
    const stores = await Store.getUserTopStores(req.user._id.toString());
    res.render('topStores', { stores, topType: 'Your Top', title: 'Your Top Stores' });
};

exports.editStore = async (req, res) => {
    const store = await Store.findOne({ _id: req.params.id });

    if (!req.user.isAdmin)
        confirmOwner(store, req.user); // Si es admin no hace falta

    res.render('editStore', { title: `Edit ${store.name}`, store: store, timeSlots: res.locals.h.timeSlots });
};

exports.deleteStore = async (req, res) => {
    const page = req.params.page ||1;
    const store = await Store.findOne({ _id: req.params.id });

    if (!store) { // Por si no existe la tienda en concreto
        req.flash('error', 'Store not found.');
        return res.redirect(`/stores/page/${page}`);
    }

    if (!req.user.isAdmin)
        confirmOwner(store, req.user); // Si es admin no hace falta

    await Store.deleteOne({ _id: req.params.id });
    
    req.flash('success', `Successfully deleted <strong>${store.name}</strong>.`);
    res.redirect(`/stores/page/${page}`);
};

//*** Verify Credentials
const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own the store in order to edit it');
    }
};

exports.updateStore = async (req, res) => {
    // Capturar los datos enviados desde el formulario
    const { closedDays, timeSlots, maxReservations } = req.body;
    
    const updatedData = {
        ...req.body,
        closedDays: Array.isArray(closedDays) ? closedDays : [],
        timeSlots: Array.isArray(timeSlots) ? timeSlots : [],
        maxReservations: parseInt(maxReservations, 10) || 10 // que sea un entero
    };

    // Encuentra y actualiza el restaurante
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, updatedData, {
        new: true,
        runValidators: true
    }).exec();

    console.log(store);
    
    req.flash('success', `Successfully updated <strong>${store.name}</strong>.<a href="/store/${store.slug}">View store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
};

exports.searchStores = async (req, res) => {
    const stores = await Store.find({
        $text: { //1er param: query filter -> conditions
            $search: req.query.q
        }
    }, { //2n param: query projection -> fields to include/exclude from the results
        score: { $meta: 'textScore' }
    }).sort({ //first filter
        score: { $meta: 'textScore' }
    }).limit(5); //second filter
    
    res.json({ stores, length: stores.length });
};

exports.getStoresByTag = async (req, res) => {
    const tag= req.params.tag;
    const tagQuery = tag || { $exists: true };

    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });

    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

    res.render('tags', { title: 'Tags', tags: tags, stores: stores, tag: tag });
};

exports.getStores = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 4; // items in each page
    const skip = (page * limit) - limit;

    const storesPromise = Store
        .find() //look for ALL
        .skip(skip) //Skip items of former pages
        .limit(limit) //Take the desired number of items
        .sort({ created: 'desc' }); //sort them

    const countPromise = Store.countDocuments();
    
    const [stores, count] = await Promise.all([storesPromise, countPromise]);
    
    const pages = Math.ceil(count / limit);
    if (!stores.length && skip) {
        req.flash('info', `You asked for page ${page}. But that does not exist. So I put you on page ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }

    res.render('stores', {
        title: 'Stores', stores: stores, page: page,
        pages: pages, count: count
    });
};

exports.storesMap = async (req, res) => {
    try {
        const stores = await Store.find(); // Obtener todas las tiendas

        // Crear un array de promesas para calcular las valoraciones
        const mapValuesPromises = stores.map(async (store) => {
            const rating = await store.getAverageRating();

            return {
                name: store.name,
                rating: rating.toFixed(1),
                address: store.address
            };
        });

        // Espera todas las promises
        const mapValues = await Promise.all(mapValuesPromises);
        
        res.render('storesMap', { title: 'Stores Map', mapValues });

    } catch (error) {
        console.error('Error al obtener las tiendas o las valoraciones:', error);
        res.status(500).send('Hubo un problema al cargar el mapa de tiendas.');
    }
};