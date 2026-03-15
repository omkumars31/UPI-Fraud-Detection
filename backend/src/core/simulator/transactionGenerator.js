const { SENDERS, RECEIVERS, CITIES, DEVICE_IDS } = require('./transactionData');

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function generateNormalTransaction() {
  const sender   = randomFrom(SENDERS);
  const receiver = randomFrom(RECEIVERS.slice(0, 10));

  return {
    senderUpiId:   sender.upiId,
    receiverUpiId: receiver.upiId,
    amount:        randomFloat(50, 2000),
    timestamp:     new Date(),
    deviceId:      randomFrom(DEVICE_IDS),
    location:      sender.city,
    _senderName:   sender.name,
    _receiverName: receiver.name,
    _type:         'NORMAL',
  };
}

function generateSuspiciousTransaction() {
  const sender   = randomFrom(SENDERS);
  const receiver = randomFrom(RECEIVERS.slice(10));

  const flags = {
    oddHours:       Math.random() > 0.4,
    highAmount:     Math.random() > 0.3,
    locationChange: Math.random() > 0.5,
  };

  let timestamp = new Date();
  if (flags.oddHours) {
    timestamp.setHours(randomInt(2, 4), randomInt(0, 59), 0, 0);
  }

  const amount = flags.highAmount
    ? randomFloat(15000, 80000)
    : randomFloat(5000, 14999);

  const otherCities = CITIES.filter((c) => c !== sender.city);
  const location = flags.locationChange
    ? randomFrom(otherCities)
    : sender.city;

  return {
    senderUpiId:   sender.upiId,
    receiverUpiId: receiver.upiId,
    amount,
    timestamp,
    deviceId:      randomFrom(DEVICE_IDS),
    location,
    _senderName:   sender.name,
    _receiverName: receiver.name,
    _type:         'SUSPICIOUS',
  };
}

function generateTransaction() {
  return Math.random() < 0.8
    ? generateNormalTransaction()
    : generateSuspiciousTransaction();
}

module.exports = { generateTransaction, generateNormalTransaction, generateSuspiciousTransaction };