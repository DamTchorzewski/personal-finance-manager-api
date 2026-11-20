import { auth as firebaseAuth } from '../config/firebase.js';

// Set REQUIRE_VERIFIED_EMAIL=false to accept users who have not confirmed their e-mail address yet.
const requireVerified = process.env.REQUIRE_VERIFIED_EMAIL !== 'false';

const reject = (res, status, statusText, message) =>
  res.status(status).json({ status, statusText, result: { message } });

// Checks the Firebase ID token in "Authorization: Bearer <token>" and sets req.user.
const auth = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return reject(res, 401, 'Unauthorized', 'Not authorized');
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);

    if (requireVerified && !decoded.email_verified) {
      return reject(res, 403, 'Forbidden', 'E-mail is not verified');
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      username: decoded.name ?? decoded.email?.split('@')[0] ?? 'User',
    };
    next();
  } catch (err) {
    reject(res, 401, 'Unauthorized', 'Not authorized');
  }
};

export default auth;
