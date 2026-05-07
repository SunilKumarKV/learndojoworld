const { z } = require('zod');

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

module.exports = {
  UserSchema,
};
