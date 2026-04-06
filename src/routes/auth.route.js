import express from 'express';
// import { registerUser, authUser,
//     //  googleAuth 
//     } from '../controllers/auth.controller.js';
import { signup, signin } from '../controllers/auth.controller.js   ';

const router = express.Router();

// router.post('/register', registerUser);
// router.post('/login', authUser);
// router.post('/google', googleAuth);
router.post('/signup', signup);
router.post('/signin', signin);

export default router;
