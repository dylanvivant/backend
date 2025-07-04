const User = require('./User');
const Event = require('./Event');
const EventParticipant = require('./EventParticipant');
const SessionNote = require('./SessionNote');
const PracticeRequest = require('./PracticeRequest');
const CaptainNomination = require('./CaptainNomination');

module.exports = {
  User: new User(),
  Event: new Event(),
  EventParticipant: new EventParticipant(),
  SessionNote: new SessionNote(),
  PracticeRequest: new PracticeRequest(),
  CaptainNomination: new CaptainNomination(),
};
