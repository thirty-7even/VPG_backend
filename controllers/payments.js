import payments_api from '../config/payments';


// USERS
const {
  getAllUsers,
  getUser,
  createUser,
  getNatural,
  getLegal,
  updateUser,
  getMyWallets,
  getMyTransactions,
  getMyCards,
  getKycDocuments,
  getKycDocument
} = require('./payments/users');


// WALLETS
const {
  createWallet,
  getWallet,
  getWalletTransactions,
  updateWallet
} = require('./payments/wallets');

const {
  createIBANBankAccount,
  createUKBankAccount,
  createUSBankAccount,
  createCABankAccount,
  createOtherBankAccount,
  getMyBankAccounts
} = require('./payments/bank-accounts');
// PAYINS
const {
  createWebPayIn,
  createDirectPayIn,
  getPayIn,
  refundPayIn
} = require('./payments/payins');


// TRANSFERS
const {
  createTransfer,
  getTransfer,
  refundTransfer,
  payForCourse
} = require('./payments/transfers');


// CARD REGISTRATIONS
const {
  createCardRegistration
} = require('./payments/card-registrations');

const {
  createCartPreAuthorization
} = require('./payments/card-pre-autorisations');


const {
  createPayOut,
  getPayOut
} = require('./payments/payouts');


const {
  createHook,
  catchPayinCreated,
  catchPayinSucceeded,
  catchPayinFailed,
  catchPayoutCreated,
  catchPayoutSucceeded,
  catchPayoutFailed
} = require('./payments/hooks');

export default {
  getAllUsers,
  getUser,
  createUser,
  getNatural,
  getLegal,
  updateUser,
  getMyWallets,
  getMyTransactions,
  getMyCards,
  getKycDocuments,
  getKycDocument,

  createWallet,
  getWallet,
  getWalletTransactions,
  updateWallet,

  createIBANBankAccount,
  createUKBankAccount,
  createUSBankAccount,
  createCABankAccount,
  createOtherBankAccount,
  getMyBankAccounts,

  createWebPayIn,
  createDirectPayIn,
  getPayIn,
  refundPayIn,

  createTransfer,
  getTransfer,
  refundTransfer,
  payForCourse,

  createCardRegistration,

  createCartPreAuthorization,

  createPayOut,
  getPayOut,

  createHook,
  catchPayinCreated,
  catchPayinSucceeded,
  catchPayinFailed,
  catchPayoutCreated,
  catchPayoutSucceeded,
  catchPayoutFailed
};
