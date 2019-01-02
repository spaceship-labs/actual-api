const user = async ({
  password = 'user.name.1',
  email = 'user1@email.com',
  firstName = 'user.firstName.1',
  lasteName = 'user.lastName.1',
}) =>
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

module.exports = {
  user,
  store,
  role,
};
