const express = require('express');
const router = express.Router();

const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const { catchErrors } = require('../handlers/errorHandler');

router.get('/index/', storeController.homePage);

//1st step ADD STORE -> show the form
router.get('/add/',
    authController.isLoggedIn,
    storeController.addStore
);

//2nd step ADD STORE -> receive the data
router.post('/add/',
    authController.isLoggedIn,
    storeController.verify, //verify type image
    catchErrors(storeController.upload), //resize and upload to filesystem
    catchErrors(storeController.createStore) //save in DB
);

//1st step EDIT STORE -> show the form with current data
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

//2nd step EDIT STORE -> receive the updated data
router.post('/add/:id',
    storeController.verify,
    catchErrors(storeController.upload),
    catchErrors(storeController.updateStore)
);

//1st step SIGN-UP a USER -> show the form
router.get('/register', userController.registerForm);

//2nd step SIGN-UP a USER -> validate, register, login
router.post('/register',
    userController.validationRules(),
    userController.validationCustomRules(),
    userController.validateRegister,
    userController.register,
    authController.login
);

//1st step LOG IN -> show the form
router.get('/login', authController.loginForm);

//2nd step LOG IN -> do the login
router.post('/login', authController.login);

//LOG OUT
router.get('/logout', authController.logout);

// SHOW ACCOUNT
router.get('/account',
    authController.isLoggedIn,
    userController.account
);

// EDIT ACCOUNT
router.post('/account',
    authController.isLoggedIn,
    catchErrors(userController.updateAccount)
);

// SHOW a certain STORE
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

// SHOW all STOREs
router.get('/stores', catchErrors(storeController.getStores));

// SHOW all STOREs with PAGINATION
router.get('/stores/page/:page', catchErrors(storeController.getStores));

//SHOW TOP STORES
router.get('/top', catchErrors(storeController.getTopStores));

// SHOW all TAGs
router.get('/tags', catchErrors(storeController.getStoresByTag));

//SHOW a certain TAG
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

// ADD REVIEW
router.post('/reviews/:id',
    authController.isLoggedIn,
    catchErrors(reviewController.addReview)
);

//RECEIVE FORGOT ACCOUNT ACTION
router.post('/account/forgot', catchErrors(authController.forgot));

//1st step RESET PASSWD -> show the form
router.get('/account/reset/:token', catchErrors(authController.reset));

//2nd step RESET PASSWD -> change passwd
router.post('/account/reset/:token',
    authController.validationCustomRules(),
    authController.validatePassUpdate,
    catchErrors(authController.updatePassword)
);

//SHOW stores MAP with reviews
router.get('/map', catchErrors(storeController.storesMap));

//***API REST --> Functions to be consumed by the front end via AJAX

//req.query -> /api/v1/search?q=hola
router.get('/api/v1/search', catchErrors(storeController.searchStores));


module.exports = router;
