const user = async ({ password, email, firstName, lasteName }) =>
  await User.create({
    password,
    email,
    firstName,
    lasteName,
  });

const store = async ({
  name = 'store.name.1',
  group = 'store.group.1',
  role,
}) => await Store.create({ name, group, role });

const role = async ({ name = 'admin' }) => await Role.create({ name });

const token = async () => {
  const authUrl = '/auth/signin';
  await User.destroy();
  const email = 'user1@email.com';
  const password = 'user.name.1';
  await user({
    password,
    email,
    firstName: 'user.firstName.1',
    lasteName: 'user.lastName.1',
  });
  const { body: { token } } = await app.post(authUrl).send({
    email,
    password,
  });
  return `JWT ${token}`;
};

module.exports = {
  user,
  store,
  role,
  token,
};
