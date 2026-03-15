const { scoreTransaction } = require('../../src/core/riskEngine/engine');



function makeTransaction(overrides = {}) {
return {
senderUpiId: 'user@okicici',
receiverUpiId: 'known@okhdfcbank',
amount: 500,
timestamp: new Date('2024-01-15T14:00:00'), // 2PM — normal hours
location: 'Mumbai',
...overrides,
};
}

function makeContext(overrides = {}) {
return {
avgAmount: 400,
knownPayees: ['known@okhdfcbank', 'friend@okaxis'],
recentTimestamps: [],
lastLocation: 'Mumbai',
...overrides,
};
}


describe('Risk Scoring Engine', () => {

describe('Clean transaction (no flags)', () => {
test('scores 0 for a completely normal transaction', () => {
const result = scoreTransaction(makeTransaction(), makeContext());
expect(result.score).toBe(0);
expect(result.triggeredFlags).toHaveLength(0);
expect(result.shouldAlert).toBe(false);
expect(result.tier.label).toBe('LOW');
});
});

describe('Signal: AMOUNT_ANOMALY', () => {

test('triggers when amount is 3x above average', () => {
  const txn = makeTransaction({ amount: 1500 });
  const result = scoreTransaction(txn, makeContext());

  expect(result.triggeredFlags).toContain('AMOUNT_ANOMALY');
  expect(result.breakdown.AMOUNT_ANOMALY).toBe(30);
});


test('does not trigger for amount just under threshold', () => {
  const txn = makeTransaction({ amount: 1199 });
  const result = scoreTransaction(txn, makeContext());

  expect(result.triggeredFlags).not.toContain('AMOUNT_ANOMALY');
});

test('flags large amount for user with no history', () => {
  const txn = makeTransaction({ amount: 15000 });
  const ctx = makeContext({ avgAmount: 0 });

  const result = scoreTransaction(txn, ctx);

  expect(result.triggeredFlags).toContain('AMOUNT_ANOMALY');
});


});

describe('Signal: NEW_PAYEE', () => {


test('triggers for a first-time payee', () => {
  const txn = makeTransaction({ receiverUpiId: 'stranger@okpaytm' });
  const result = scoreTransaction(txn, makeContext());

  expect(result.triggeredFlags).toContain('NEW_PAYEE');
  expect(result.breakdown.NEW_PAYEE).toBe(20);
});

test('does not trigger for known payee', () => {
  const txn = makeTransaction({ receiverUpiId: 'known@okhdfcbank' });
  const result = scoreTransaction(txn, makeContext());

  expect(result.triggeredFlags).not.toContain('NEW_PAYEE');
});


});

describe('Signal: TRANSACTION_VELOCITY', () => {


test('triggers when more than 3 transactions in 10 minutes', () => {

  const now = Date.now();

  const recentTimestamps = [
    new Date(now - 1 * 60 * 1000),
    new Date(now - 3 * 60 * 1000),
    new Date(now - 5 * 60 * 1000),
    new Date(now - 7 * 60 * 1000),
  ];

  const ctx = makeContext({ recentTimestamps });

  const result = scoreTransaction(makeTransaction(), ctx);

  expect(result.triggeredFlags).toContain('TRANSACTION_VELOCITY');

});

test('does not trigger for 3 or fewer transactions', () => {

  const now = Date.now();

  const recentTimestamps = [
    new Date(now - 2 * 60 * 1000),
    new Date(now - 5 * 60 * 1000),
  ];

  const ctx = makeContext({ recentTimestamps });

  const result = scoreTransaction(makeTransaction(), ctx);

  expect(result.triggeredFlags).not.toContain('TRANSACTION_VELOCITY');

});

});

describe('Signal: ODD_HOURS', () => {


test('triggers between 1AM and 5AM', () => {
  const txn = makeTransaction({
    timestamp: new Date('2024-01-15T03:00:00')
  });

  const result = scoreTransaction(txn, makeContext());

  expect(result.triggeredFlags).toContain('ODD_HOURS');
});

test('does not trigger at normal hours', () => {
  const txn = makeTransaction({
    timestamp: new Date('2024-01-15T10:00:00')
  });

  const result = scoreTransaction(txn, makeContext());

  expect(result.triggeredFlags).not.toContain('ODD_HOURS');
});


});

describe('Signal: LOCATION_CHANGE', () => {


test('triggers when location changes', () => {
  const txn = makeTransaction({ location: 'Delhi' });
  const ctx = makeContext({ lastLocation: 'Mumbai' });

  const result = scoreTransaction(txn, ctx);

  expect(result.triggeredFlags).toContain('LOCATION_CHANGE');
});

test('does not trigger with no prior location', () => {
  const ctx = makeContext({ lastLocation: null });

  const result = scoreTransaction(makeTransaction(), ctx);

  expect(result.triggeredFlags).not.toContain('LOCATION_CHANGE');
});


});

describe('Combined: High-risk scenario', () => {


test('CRITICAL score when multiple signals trigger', () => {

  const now = Date.now();

  const txn = makeTransaction({
    amount: 50000,
    receiverUpiId: 'hacker@okpaytm',
    timestamp: new Date('2024-01-15T02:30:00'),
    location: 'Chennai',
  });

  const ctx = makeContext({
    avgAmount: 400,
    knownPayees: ['friend@okaxis'],
    lastLocation: 'Mumbai',
    recentTimestamps: [
      new Date(now - 1 * 60 * 1000),
      new Date(now - 2 * 60 * 1000),
      new Date(now - 3 * 60 * 1000),
      new Date(now - 4 * 60 * 1000),
    ],
  });

  const result = scoreTransaction(txn, ctx);

  expect(result.score).toBe(100);
  expect(result.tier.label).toBe('CRITICAL');
  expect(result.shouldAlert).toBe(true);
  expect(result.triggeredFlags).toHaveLength(5);

});

});

describe('shouldAlert threshold', () => {

test('sets shouldAlert true when score >= 60', () => {

  const txn = makeTransaction({
    amount: 50000,
    receiverUpiId: 'new@upi',
    timestamp: new Date('2024-01-15T02:00:00'),
  });

  const ctx = makeContext({ avgAmount: 400 });

  const result = scoreTransaction(txn, ctx);

  expect(result.shouldAlert).toBe(true);

});

});

});
