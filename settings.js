/*

All project settings go here

*/

exports.port = process.env.PORT || 3000;

exports.GoogleMapsAPI = 'maps api goes here';

exports.CookieSecret = 'gowolfpack'

exports.mongoose = require('mongoose').connect('localhost','guide');