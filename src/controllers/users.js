// The accounts live in Firebase Authentication (sign-up, sign-in, the verification e-mail); the API only reads the
// signed-in user from the verified token.
const getCurrent = (req, res) => {
  const { username, email } = req.user;

  res.json({
    status: 200,
    statusText: 'OK',
    result: { user: { username, email } },
  });
};

const usersController = { getCurrent };

export default usersController;
