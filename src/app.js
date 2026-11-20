import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';
import swaggerUI from 'swagger-ui-express';
import path from 'path';
import 'dotenv/config';
import usersRouter from './routes/users.js';
import transactionsRouter from './routes/transactions.js';

const app = express();
const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

const swaggerPath = path.resolve(process.cwd(), 'src/docs/swagger.json');
const swaggerJson = JSON.parse(fs.readFileSync(swaggerPath));
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerJson));

app.use(morgan(formatsLogger));
// CORS_ORIGIN: the allowed web origins, comma separated (the site that calls the API); empty = any origin
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));

// for the host's health check; it does not touch Firestore
app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);

// an unknown route
app.use((_, res) => {
  res.status(404).json({
    status: 404,
    statusText: 'Not Found',
    result: { message: 'Not found' },
  });
});

// any other error
app.use((err, _, res, __) => {
  console.error(err);
  res.status(500).json({
    status: 500,
    statusText: 'Internal Server Error',
    result: { message: 'Internal server error' },
  });
});

export default app;
