import app from './app.js';

// Cloud Run sets PORT (8080); locally the default is the same.
const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, () => {
  console.log(`Personal Finance Manager API listening on port ${PORT}`);
});
