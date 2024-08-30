// This file demonstrates how to create a SCIMMY server using the SCIMMY and SCIMMYRouters packages.
import express from 'express';
import SCIMMYRouters, { SCIMMY } from 'scimmy-routers';
import { User } from './db.js';
import crypto from 'crypto';
import { fromSCIMMYUser, toSCIMMYUser } from './scim/userUtils.js';

// Create a new express app
const app = express();

const ADMIN_USER_IDS = [ 1 ];
const WHITELISTED_PATHS_FOR_NON_ADMINS = [ "/Me", "/Schemas" ];

// Declare resource types to SCIMMY package (see SCIMMY documentation for more details)
SCIMMY.Resources.declare(SCIMMY.Resources.User, {

  // Handler for GET requests to the /Users endpoint
  egress: async (resource, data) => {
    // The id is either passed in the query string (/scim/Users/{id}) 
    // or deduced from the api key when the using the /scim/me endpoint (see the use of `getIdByApiKey` in the authorization handler below)
    const { id } = resource;
    if (id) {
      const user = await User.getByID(id);
      if (!user) {
        throw new SCIMMY.Types.Error(404, null, `User with ID ${id} not found`);
      }
      return toSCIMMYUser(user);
    } else {
      const users = await User.getAllUsers();
      return users.map(user => toSCIMMYUser(user));
    }
  },

  ingress: async (resource, data) => {
    try {
      console.log('Resource:', resource, 'Data:', data);
      const { id } = resource;
      if (id) {
        // This is an update request.
        // Get the user from the database and ensure it exists
        const oldUser = await User.getByID(id);
        if (!oldUser) {
          throw new SCIMMY.Types.Error(404, null, `User with ID ${id} not found`);
        }

        // Now update the user. The data object contains the new user data 
        // Any missing property in the data object is removed from the user
        const updatedUser = fromSCIMMYUser(data, { id: oldUser.id, apiKey: oldUser.apiKey});
        try {
          await updatedUser.updateInDb();
        } catch (ex) {
          console.error(ex);
          throw ex;
        }
        return toSCIMMYUser(await updatedUser.getRefreshedFromDb());
      } else {
        // This is a create request
        const newUser = fromSCIMMYUser(data, {
          apiKey: crypto.randomBytes(32).toString('hex')
        });
        await newUser.insertIntoDb();
        return toSCIMMYUser(await newUser.getRefreshedFromDb());
      }
    } catch (ex) {
      console.error('Error in ingress handler:', ex.stack);
      if (ex instanceof SCIMMY.Types.Error) {
        throw ex;
      }
      if (ex.code?.startsWith('SQLITE')) {
        switch (ex.code) {
          case 'SQLITE_CONSTRAINT':
            throw new SCIMMY.Types.Error(409, 'uniqueness', ex.message);
          default:
            throw new SCIMMY.Types.Error(500, 'serverError', ex.message);
        }
      }
    }
  },

  degress: async (resource, data) => {
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

SCIMMY.Resources.declare(SCIMMY.Resources.Group, {/* Your handlers for group resource type */})

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

    // Disallow non-admin users from accessing paths that are not whitelisted (like `/Me`)
    if (!WHITELISTED_PATHS_FOR_NON_ADMINS.includes(request.path) && !ADMIN_USER_IDS.includes(id)) {
      throw new Error('You are not authorized to access this resource!');
    }

    return String(id); // The user ID in our case is a number, it is expected to be a string
  }
}));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
