import { db } from '../config/firebase.js';

// Each user has their own collection: users/{uid}/transactions/{id}. The documents keep the fields the web app sends
// (type, category, date, comment, sum) plus createdAt and updatedAt; the API returns the document id as _id.
const collection = uid =>
  db.collection('users').doc(uid).collection('transactions');

const toItem = doc => ({ _id: doc.id, ...doc.data() });

const byDateDesc = (a, b) =>
  `${b.date.year}${b.date.month}${b.date.day}`.localeCompare(
    `${a.date.year}${a.date.month}${a.date.day}`
  );

const getTransactions = async uid => {
  const snapshot = await collection(uid).get();
  return snapshot.docs.map(toItem).sort(byDateDesc);
};

const getTransactionCategory = async (uid, id) => {
  const doc = await collection(uid).doc(id).get();
  return doc.exists ? doc.data().category : undefined;
};

const createTransaction = async (uid, body) => {
  const now = new Date().toISOString();
  const ref = await collection(uid).add({
    ...body,
    createdAt: now,
    updatedAt: now,
  });
  return toItem(await ref.get());
};

const removeTransaction = async (uid, id) => {
  const ref = collection(uid).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.delete();
  return toItem(doc);
};

const updateTransaction = async (uid, id, body) => {
  const ref = collection(uid).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update({ ...body, updatedAt: new Date().toISOString() });
  return toItem(await ref.get());
};

const service = {
  getTransactions,
  getTransactionCategory,
  createTransaction,
  removeTransaction,
  updateTransaction,
};

export default service;
