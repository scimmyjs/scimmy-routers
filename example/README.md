# Example of use for scimmy-routers

## Install the project

First go to the scimmy-routers root directory, install the dependencies and build the project:
```bash
cd scimmy-routers/
npm install
npm run build
```

Then go to the `examples/` directory and install the dependencies (basically scimmy-routers):
```bash
cd examples/
npm install
```

## Structure of the database

The database structure is quite simple: there are only two tables, `users` and `logins`.
Each user is supposed to be identified by their email addresses, hence the UNIQUE constraint on `logins.email`.
The users table has a name, an api_key, and a picture. A user can have multiple logins, which are stored in the logins table. Each login has an email address and a flag indicating whether it is the primary login for the user.

That being said, you can easily notice that the database structure contains differences with the SCIM Users schema. For example, the latter expects a `userName`. If you take a look at the code, you will notice the `userName` is just an alias for the primary email.

## The code

Want to take a tour of the code? Here are few concepts to have in mind for this example:
 - The main logic resides in `index.js`;
 - The database model is represented in modules under the `db/` folder;
 - And some utilities exist under the `scim/` folder which handle the conversion of SCIM Resource to Database model and vice versa.

Currently the only resource supported in this example is the User.

Now start by taking a look at the `index.js` file 👀.

### Features supported

With only the `ingress`, `egress` and `degress` handlers added in the `index.js` file, the following SCIM features are supported out of the box:

- All the mandatory endpoints: 
  - Resource creation using `POST /Resources/`; 
  - Resource modification using `PUT /Resources/:id`; 
  - Resource retrievals using `GET /Resources/` for all of them or `GET /Resources/:id` just for one;
  - and Resource deletion using `DELETE /Resources/:id`.
- The `/Schemas`, `/ServiceProviderConfig`, `/ResourceTypes`;
- The `/Me` endpoint (it takes advantage of the `id` you returned in the authentication middleware);
- The `POST /Bulk` endpoint;
- Queries with sorting and filtering (whenever you use `GET /Resource` with the query params or the `POST /Resources/.search` endpoint);
- Pagination of the results;
- The `PATCH /Resources/:id` endpoint! It reads a resource using the egress method, applies the asked changes, and calls the ingress method to update the record;

Amazing, isn't it? 🤯
Take a look at the curl commands below to know how to play with the server.

## Run the server

Once you have setup your environment, just run the following command:
```bash
npm start
```

### Troubleshoot

You may also start the server in debug mode (with the nodejs inspector enabled) with this command:
```bash
npm run debug
```

Take a look at this documentation to see how to then connect to an inspector client and start placing breakpoints: https://nodejs.org/en/learn/getting-started/debugging#inspector-clients

## Play with the SCIM server


### Query a single user

Query the user #2 using the `admin` account:

```bash
curl -H 'Authorization: Bearer api_key_admin' -v http://localhost:3000/scim/Users/2
```

### Get information about yourself (`/Me`)

Query yourself using the `user` account:
```bash
curl -H 'Authorization: Bearer api_key_user' -v http://localhost:3000/scim/Me
```

### Fetch all the users

Query all the users using the `admin` account:
```bash 
curl -H 'Authorization: Bearer api_key_admin' -v http://localhost:3000/scim/Users
```

### Insert a new user

```bash
curl -H 'Authorization: Bearer api_key_admin' -H 'Content-Type: application/scim+json' -X POST -d '{
  "schemas": [
    "urn:ietf:params:scim:schemas:core:2.0:User"
  ],
  "userName": "bjensen@example.org",
  "name": {
    "formatted": "Barbara Jensen"
  },
  "emails": [
    {
      "value": "bjensen@example.org",
      "primary": true
    }
  ]
}' -v http://localhost:3000/scim/users
```

### Update an existing user (replace all their attributes)

Here we replace the user of id 2 using the `PUT` method. Any omitted attribute will be removed from the record.
```bash
curl -H 'Authorization: Bearer api_key_admin' -H 'Content-Type: application/scim+json' -X PUT -d '{
  "schemas": [
    "urn:ietf:params:scim:schemas:core:2.0:User"
  ],
  "userName": "bjensen2@example.org",
  "name": {
    "formatted": "Ms. Barbara J Jensen III"
  },
  "emails": [
    {
      "value": "bjensen2@example.org",
      "primary": true
    },{
      "value": "bjensen2-alias@example.org",
      "primary": false
    }
  ]
}' -v http://localhost:3000/scim/Users/2
```

### Update an existing user (replace only part of their attributes)

Update the admin email alias, using the `PATCH` method. Unlike the `PUT` method, any omitted attribute will NOT be deleted:
```bash
curl -v -H 'Authorization: Bearer api_key_admin' -H 'Content-Type: application/scim+json' http://localhost:3000/scim/Users/1 -X PATCH -d '{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [{ 
    "op": "replace",
    "path": "emails[ primary eq false ]",
    "value": {"value": "admin-alias2@example.org"}
  }]
}'
```

### Make several creations in a Bulk operation

```bash
curl -v -H 'Authorization: Bearer api_key_admin' -H 'Content-Type: application/scim+json' http://localhost:3000/scim/Bulk -X POST -d '{
  "schemas": [
    "urn:ietf:params:scim:api:messages:2.0:BulkRequest"
  ],
  "Operations": [
    {
      "method": "POST",
      "path": "/Users",
      "bulkId": "user-0",
      "data": {
        "schemas": [
          "urn:ietf:params:scim:schemas:core:2.0:User"
        ],
        "userName": "bjensen-0@example.org",
        "name": {
          "formatted": "Barbara Jensen 0"
        },
        "emails": [
          {
            "value": "bjensen-0@example.org",
            "primary": true
          }
        ]
      }
    },
    {
      "method": "POST",
      "path": "/Users",
      "bulkId": "user-1",
      "data": {
        "schemas": [
          "urn:ietf:params:scim:schemas:core:2.0:User"
        ],
        "userName": "bjensen-1@example.org",
        "name": {
          "formatted": "Barbara Jensen 1"
        },
        "emails": [
          {
            "value": "bjensen-1@example.org",
            "primary": true
          }
        ]
      }
    }
  ]
}'
```

### Querying with filters

Search for the userName of users with an `r` in their formatted name using the search request with filters, and sort by `userName`:
```bash
curl -H 'Authorization: Bearer api_key_admin' -v -d '{
          "schemas": ["urn:ietf:params:scim:api:messages:2.0:SearchRequest"],
          "attributes": ["userName"],
          "filter": "name.formatted co \\"r\\"",
          "sortBy": "userName",
          "startIndex": 1,
          "count": 10
        }' -H 'Content-Type: application/scim+json' -X  POST 'http://localhost:3000/scim/Users/.search'
```

### Delete a user

Delete the user whose ID is `4`:

```bash
curl -H 'Authorization: Bearer api_key_admin' -v -X DELETE 'http://localhost:3000/scim/Users/4'
```
