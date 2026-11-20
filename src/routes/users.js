import express from 'express';
import usersController from '../controllers/users.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/current', auth, usersController.getCurrent);

export default router;
