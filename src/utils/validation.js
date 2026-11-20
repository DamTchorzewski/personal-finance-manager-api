import Joi from 'joi';

const CATEGORIES = [
  'Main expenses',
  'Products',
  'Car',
  'Self care',
  'Child care',
  'Household products',
  'Education',
  'Leisure',
  'Other expenses',
  'Entertainment',
  'Income',
];

const date = Joi.object({
  day: Joi.string().trim().required(),
  month: Joi.string().trim().required(),
  year: Joi.string().trim().required(),
});

const fields = {
  type: Joi.string().valid('-', '+'),
  category: Joi.string().valid(...CATEGORIES),
  date,
  comment: Joi.string().trim(),
  sum: Joi.alternatives(Joi.string().trim(), Joi.number()).custom(String),
};

// A new transaction: every field but the category is required.
export const transactionCreateSchema = Joi.object({
  ...fields,
  type: fields.type.required(),
  date: fields.date.required(),
  comment: fields.comment.required(),
  sum: fields.sum.required(),
});

// An update: any of the fields; the web app also sends the id of the transaction, which is ignored.
export const transactionUpdateSchema = Joi.object({
  ...fields,
  id: Joi.any().strip(),
});

// Unknown keys are dropped, so a request cannot write fields the API does not define.
export const validate = (schema, body) =>
  schema.validateAsync(body, { stripUnknown: true });
