import payments from '../../controllers/payments';

import { loginCheck } from './../../utils';

module.exports = function (app) {

  // USERS
  app.post('/api/payments/users/create', payments.createUser);
  app.get('/api/payments/users/get-all', payments.getAllUsers);
  app.post('/api/payments/users/get', payments.getUser);
  app.post('/api/payments/users/get-natural', payments.getNatural);
  app.post('/api/payments/users/get-legal', payments.getLegal);
  app.post('/api/payments/users/update', payments.updateUser);


  app.post('/api/payments/bank-accounts/create-iban', loginCheck('user'), payments.createIBANBankAccount);
  app.post('/api/payments/bank-accounts/create-other', loginCheck('user'), payments.createOtherBankAccount);


  app.get('/api/payments/users/get-my-wallets', loginCheck('user'), payments.getMyWallets); // for this user
  app.get('/api/payments/users/get-my-transactions', loginCheck('user'), payments.getMyTransactions);
  app.get('/api/payments/users/get-my-cards', loginCheck('user'), payments.getMyCards);
  app.get('/api/payments/users/get-my-bank-accounts', loginCheck('user'), payments.getMyBankAccounts);


  // WALLETS
  app.post('/api/payments/wallets/create', loginCheck('user'), payments.createWallet);
  app.post('/api/payments/wallets/get', loginCheck('user'), payments.getWallet);
  app.post('/api/payments/wallets/update', loginCheck('user'), payments.updateWallet);
  app.post('/api/payments/wallets/transactions', loginCheck('user'), payments.getWalletTransactions);


  // PAYINS
  app.post('/api/payments/payins/create', loginCheck('user'), payments.createWebPayIn);
  app.post('/api/payments/payins/create-direct', loginCheck('user'), payments.createDirectPayIn);
  app.post('/api/payments/payins/update', loginCheck('user'), payments.getPayIn);



  // TRANSFERS
  app.post('/api/payments/transfers/create', loginCheck('user'), payments.createTransfer);
  app.post('/api/payments/transfers/get', loginCheck('user'), payments.getTransfer);


  // CARD PRE AUTHODISATIONS
  app.post('/api/payments/card-pre-authorizations/create', loginCheck('user'), payments.createCartPreAuthorization);


  // CARD REGISTRATIONS
  app.post('/api/payments/card-registrations/create', loginCheck('user'), payments.createCardRegistration);


  // HOOKS
  app.post('/api/payments/hooks/create', loginCheck('super-admin'), payments.createHook);

  app.get('/api/payments/hooks/payin-created', payments.catchPayinCreated); // this is PAYIN_NORMAL_CREATED
  app.get('/api/payments/hooks/payin-succeeded', payments.catchPayinSucceeded); // this is PAYIN_NORMAL_SUCCEEDED
  app.get('/api/payments/hooks/payin-failed', payments.catchPayinFailed); // this is PAYIN_NORMAL_FAILED
  app.get('/api/payments/hooks/payout-created', payments.catchPayoutCreated); // this is PAYOUT_NORMAL_CREATED
  app.get('/api/payments/hooks/payout-succeeded', payments.catchPayoutSucceeded); // this is PAYOUT_NORMAL_SUCCEEDED
  app.get('/api/payments/hooks/payout-failed', payments.catchPayoutFailed); // this is PAYOUT_NORMAL_FAILED



  // PAYOUTS
  app.post('/api/payments/payouts/create', loginCheck('user'), payments.createPayOut);
  app.post('/api/payments/payouts/get', loginCheck('user'), payments.getPayOut);
}
