<img alt="SCIMMY Express Routers" src="https://scimmyjs.github.io/static/assets/routers.svg" width="512" />

# SCIMMY Express Routers

Provides a set of express routers that implement the application-level HTTP-based SCIM 2.0 protocol ([RFC7644](https://datatracker.ietf.org/doc/html/rfc7644)), which is designed to simplify resource provisioning and identity management in cloud-based applications and services.  
The routers leverage work done in the [SCIMMY](https://github.com/scimmyjs/scimmy) package, which provides a set of tools that can be used to parse incoming, and format outgoing data according to the SCIM 2.0 protocol.

##### Requirements
*   [Node.js](https://nodejs.org) v16+ with NPM 7+ 

## 🛠️ Installation and Usage

Through NPM:
```
$ npm install scimmy-routers
```

In your code:
```js
import express from "express";
import SCIMMY from "scimmy";
import SCIMMYRouters from "scimmy-routers";

// Create a new express app
const app = express();

// Declare resource types to SCIMMY package (see SCIMMY documentation for more details)
SCIMMY.Resources.declare(SCIMMY.Resources.User, {/* Your handlers for user resource type */});
SCIMMY.Resources.declare(SCIMMY.Resources.Group, {/* Your handlers for group resource type */});

// Instantiate SCIMMYRouters as new middleware for express
app.use("/scim", new SCIMMYRouters({
    type: "bearer",
    docUri: "https://example.com/help/oauth.html",
    // Your handler for verifying authentication status of a request
    handler: (request) => {
        if (!request.header("Authorization")?.startsWith("Bearer ")) {
            throw new Error("Authorization not detected!");
        } else {
            // This ID is used for to tell what user should the `/me` endpoint target.
            return "some-user-ID";
        }
    },
    // Optionally, some method to provide additional context to requests...
    context: (request) => {
        // ...in this case, the URL params from the express request 
        return request.params;
    }
}));
```

## 🔗 API

SCIMMY Express Routers provides a constructable middleware class which extends the Express Router class.  
It can be used at any level of an Express app, as with any other middleware, however it is recommended that you include
the path ```/scim``` somewhere in your mountpath.  

The SCIMMYRouters constructor accepts a single configuration object argument which defines how authentication will be handled in the middleware.
The properties of that object are:  
*   ```type``` - required string specifying SCIM service provider authentication scheme type.
    *   Currently supported values are "oauth", "bearer", "basic", and "digest", 
        which respectively map to authenticationScheme types of "oauth2", "oauthbearertoken", "httpbasic", and "httpdigest".

*   ```handler``` - required function specifying the method to invoke to authenticate SCIM requests to this middleware.
    *   If a request is not authenticated, the function should throw a new Error with a brief message to be passed back by the response.
    *   If a specific user is authenticated, the function should return the ID string of the authenticated user.

*   ```context``` - optional function specifying the method to invoke to provide additional context to SCIM requests.
    *   Evaluated for each request, it can return anything, with the returned value passed directly to the ingress/egress/degress handler methods.

*   ```baseUri``` - optional function specifying the method to invoke to determine the URL to use as the base URI for any location properties.
    *   If specified, it must return either `null`/`undefined`, or a valid URL string beginning with `https://`.
    *   If omitted, or if it returns `null`/`undefined`, location properties will default to relative paths.

*   ```docUri``` - optional string specifying the URL to use as the documentation URI for the service provider authentication scheme.

## 🚀 Example

You would like to see it in action, and discover all the capabilities this package offers you with few lines of code?
Take a look at the [example](/example/README.md), follow the instructions to setup a SCIM server to play with, and take a look at the code.
