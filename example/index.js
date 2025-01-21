// This file demonstrates how to create a SCIMMY server using the SCIMMY and SCIMMYRouters packages.
import express from 'express';
import SCIMMYRouters, { SCIMMY } from 'scimmy-routers';
import { User } from './db/index.js';
import crypto from 'crypto';
import { fromSCIMMYUser, toSCIMMYUser } from './utils/userUtils.js';
import { initDb } from './db/init-db.js';

// Create a new express app
const app = express();

const ADMIN_USER_IDS = [ 1 ];
const WHITELISTED_PATHS_FOR_NON_ADMINS = [ "/Me", "/Schemas", "/ResourceTypes", "/ServiceProviderConfig" ];

// Declare resource types to SCIMMY package (see SCIMMY documentation for more details)
//
// Note that SCIMMY is a singleton, that's how SCIMMYRouters knows about the resources declared here.
SCIMMY.Resources.declare(SCIMMY.Resources.User, {
  // Handler for fetching one or many resources
  egress: async (resource, data) => {
    console.info('Egress called: ', resource, data);
    // The id is either passed in the query string (/scim/Users/{id}) 
    // or deduced from the api key when the using the /scim/me endpoint (see the use of `getIdByApiKey` in the authorization handler below)
    const { id, filter } = resource;
    if (id) {
      // Get the user by their ID
      const user = await User.getByID(id);
      // Raise a 404 error if the user is not found
      // This will be caught by SCIMMY and returned as a 404 response compliant with the SCIM RFC
      if (!user) {
        throw new SCIMMY.Types.Error(404, null, `User with ID ${id} not found`);
      }
      // Convert the user DB model to a SCIMMY user object and return it
      // so SCIMMY will format a compliant SCIM response
      return toSCIMMYUser(user);
    }
    // No ID was passed, so we are querying all users from the DB
    const users = await User.getAllUsers();
    // Convert all users to SCIMMY user objects
    const scimmyUsers = users.map(user => toSCIMMYUser(user));

    // Either return all users or filter them based on the passed filter if it exists
    // The filter is passed in the query string or through the body of the /Resource/.search
    // See https://www.rfc-editor.org/rfc/rfc7644#section-3.4.2.2
    return filter ? filter.match(scimmyUsers) : scimmyUsers;
  },

  // Handler for udpating or creating one resource
  ingress: async (resource, data) => {
    console.info('Ingress called: ', resource, data);
    try {
      const { id } = resource;
      if (id) {
        // This is an update request.
        // Get the user from the database and ensure it exists
        const oldUser = await User.getByID(id);
        if (!oldUser) {
          throw new SCIMMY.Types.Error(404, null, `User with ID ${id} not found`);
        }

        // Now update the user. The data object contains the new user data 
        // We just keep the ID and API key from the old user (we assume the api key cannot be changed using SCIM).
        const updatedUser = fromSCIMMYUser(data, { id: oldUser.id, apiKey: oldUser.apiKey});
        await updatedUser.updateInDb();
        // Refresh the user from the database and return it as a SCIMMY user object
        return toSCIMMYUser(await updatedUser.getRefreshedFromDb());
      } else {
        // This is a creation request
        const newUser = fromSCIMMYUser(data, {
          apiKey: crypto.randomBytes(32).toString('hex')
        });
        await newUser.insertIntoDb();
        // Refresh the user from the database and return it as a SCIMMY user object
        return toSCIMMYUser(await newUser.getRefreshedFromDb());
      }
    } catch (ex) {
      console.error('Error in ingress handler:', ex.stack);
      // If the error is already instanciated using SCIMMY.Types.Error, just throw it.
      if (ex instanceof SCIMMY.Types.Error) {
        throw ex;
      }
      if (ex.code?.startsWith('SQLITE')) {
        switch (ex.code) {
          case 'SQLITE_CONSTRAINT':
            // Return a 409 error if a conflict is detected (e.g. email already exists)
            // "uniqueness" is an error code expected by the SCIM RFC for this case.
            // FIXME: the emails are unique in the database, but this is not enforced in the schema.
            throw new SCIMMY.Types.Error(409, 'uniqueness', ex.message);
          default:
            throw new SCIMMY.Types.Error(500, 'serverError', ex.message);
        }
      }
      // If the error is not a SCIMMY error, throw a 500 error.
      throw new SCIMMY.Types.Error(500, 'serverError', ex.message);
    }
  },

  // Handler for deleting one resource
  degress: async (resource, data) => {
    console.info('Degress called: ', resource, data);
    const { id } = resource;
    if (id) {
      const user = await User.getByID(id);
      if (!user) {
        throw new SCIMMY.Types.Error(404, null, `User with ID ${id} not found`);
      }
      await user.deleteFromDb();
    } else {
      throw new SCIMMY.Types.Error(404, null, 'An id is required to delete a user.');
    }
  }
});

// Create a new SCIMMY server
// The SCIMMY server will be mounted at the /scim endpoint
// The SCIMMY server will use the SCIMMYRouters package to handle SCIM requests
app.use("/scim", new SCIMMYRouters({
  type: "bearer",
  docUri: "https://example.com/help/oauth.html",
  // Your handler for verifying authentication status of a request
  handler: async (request) => {
    const authorization = request.header("Authorization");
    const bearerToken = authorization?.match(/Bearer\s+(.*)/)?.[1];
    if (!bearerToken) {
      throw new Error("Authorization not detected!");
    }

    // Get the user ID from the API key
    // Typically useful for the /scim/me endpoint
    const id = await User.getIdByApiKey(bearerToken);
    if (id === null || id === undefined) {
      throw new Error("Invalid API key!");
    }

    console.info('Authenticated as user ID:', id);
    console.info('Request body:', request.body);


    // Disallow non-admin users from accessing paths that are not whitelisted (like `/Me`)
    if (!WHITELISTED_PATHS_FOR_NON_ADMINS.includes(request.path) && !ADMIN_USER_IDS.includes(id)) {
      throw new Error('You are not authorized to access this resource!');
    }

    return String(id); // The user ID in our case is a number, it is expected to be a string
  }
}));

async function main() {
  await initDb();
  app.listen(3000, () => {
    console.info("🚀 Scim Server running on port 3000");
  });
}

main();
