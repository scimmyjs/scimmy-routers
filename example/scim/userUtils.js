import { SCIMMY } from "scimmy-routers";
import { Login, User } from "../db/index.js";

/**
 * Converts a user from your database to a SCIMMY user 
 *
 * @param {User} user 
 * @returns {SCIMMY.Schemas.User}
 */
export function toSCIMMYUser(user) {
  const primaryEmail = user.logins.find(login => login.primary).email;
  return new SCIMMY.Schemas.User({
    id: String(user.id),
    userName: primaryEmail,
    name: {
      formatted: user.name,
    },
    emails: user.logins.map(login => ({
      value: login.email,
      primary: login.primary,
    })),
  });
};

/**
 * Converts a user from SCIMMY to your database
 *
 * @param {SCIMMY.Schemas.User} scimmyUser
 * @param {Object} [defaultUserProperties] some properties to be set by default on the user
 * @returns {User}
 */
export function fromSCIMMYUser(scimmyUser, defaultUserProperties = {}) {
  // validate scimmyUser has one and only one primary email
  let emails = scimmyUser.emails;
  if (!emails || !emails.length) {
    emails = [{
      value: scimmyUser.userName,
      primary: true,
    }];
  }
  const primaryEmails = emails.filter(email => email.primary);

  if (primaryEmails.length !== 1) {
    throw new SCIMMY.Types.Error(400, 'invalidValue', 'SCIMMY user must have one and only one primary email');
  }
  if (primaryEmails[0].value !== scimmyUser.userName) {
    throw new SCIMMY.Types.Error(400, 'invalidValue', 'SCIMMY user primary email must match the userName');
  }

  const logins = emails.map(email => new Login({
    email: email.value,
    primary: email.primary,
  }));
  const uniqueEmails = new Set(logins.map(login => login.email));
  if (uniqueEmails.size !== logins.length) {
    throw new SCIMMY.Types.Error(400, 'invalidValue', 'SCIMMY user must have unique emails');
  }
  return new User({
    ...defaultUserProperties,
    name: scimmyUser.name.formatted,
    picture: scimmyUser.photos?.[0]?.value, // SCIM supports multiple photos, but let's take only the first one for simplicity
    logins,
  });
}
