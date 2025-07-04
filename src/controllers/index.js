// ========================================
// CONTROLLERS INDEX
// src/controllers/index.js
// ========================================

const authController = require('./authController');
const eventsController = require('./eventsController');
const sessionNotesController = require('./sessionNotesController');
const usersController = require('./usersController');
const practiceRequestsController = require('./practiceRequestsController');
const nominationsController = require('./nominationsController');

module.exports = {
  authController,
  eventsController,
  sessionNotesController,
  usersController,
  practiceRequestsController,
  nominationsController,
};

// Pour une utilisation plus simple :
// const { authController } = require('../controllers');
// au lieu de :
// const authController = require('../controllers/authController');
