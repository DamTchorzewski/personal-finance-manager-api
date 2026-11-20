import service from '../services/transactions.js';
import { handleValidationError } from '../utils/handleErrors.js';
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  validate,
} from '../utils/validation.js';

const notFound = (res, id) =>
  res.status(404).json({
    status: 404,
    statusText: 'Not Found',
    result: { message: `Not found transaction id: ${id}` },
  });

const get = async (req, res, next) => {
  try {
    const result = await service.getTransactions(req.user.uid);
    res.json({ status: 200, statusText: 'OK', result });
  } catch (err) {
    next(err);
  }
};

const getCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.getTransactionCategory(req.user.uid, id);

    if (!result) return notFound(res, id);

    res.json({ status: 200, statusText: 'OK', result });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const body = await validate(transactionCreateSchema, req.body);
    const result = await service.createTransaction(req.user.uid, body);

    res.status(201).json({ status: 201, statusText: 'Created', result });
  } catch (err) {
    handleValidationError(err, res, next);
  }
};

const remove = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await service.removeTransaction(req.user.uid, id);

    if (!result) return notFound(res, id);

    res.json({ status: 200, statusText: 'OK', result });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  const { id } = req.params;
  try {
    const body = await validate(transactionUpdateSchema, req.body);
    const result = await service.updateTransaction(req.user.uid, id, body);

    if (!result) return notFound(res, id);

    res.json({ status: 200, statusText: 'OK', result });
  } catch (err) {
    handleValidationError(err, res, next);
  }
};

const transactionsController = {
  get,
  getCategory,
  create,
  remove,
  update,
};

export default transactionsController;
