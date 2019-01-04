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

module.exports = {
  user,
  store,
  role,
};
