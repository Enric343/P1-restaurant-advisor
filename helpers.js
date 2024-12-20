exports.moment = require('moment');
exports.dump = (obj) => JSON.stringify(obj, null, 2);
exports.menu = [
    { slug: '/stores', title: 'Stores', },
    { slug: '/map', title: 'Map', },
    { slug: '/tags', title: 'Tags', },
    { slug: '/top', title: 'Top', },
    { slug: '/add', title: 'Add', },
    { slug: '/myTop', title: 'MyTop', },
];

exports.admins = [
    'admin@gmail.com',
    'dev@gmail.com'
];

exports.timeSlots = [
    '12:00-13:00', '12:30-13:30', '13:00-14:00', '13:30-14:30', '14:00-15:00',
    '14:30-15:30', '15:00-16:00', '15:30-16:30', '16:00-17:00', '16:30-17:30',
    '17:00-18:00', '17:30-18:30', '18:00-19:00', '18:30-19:30', '19:00-20:00',
    '19:30-20:30', '20:00-21:00', '20:30-21:30', '21:00-22:00', '21:30-22:30',
    '22:00-23:00', '22:30-23:30', '23:00-00:00'
];
