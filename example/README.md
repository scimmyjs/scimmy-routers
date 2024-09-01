# Example of use for scimmy-routers

## Install the project

First go to the scimmy-routers root directory, install the dependencies and build the project:
```bash
$ cd scimmy-routers/
$ npm install
$ npm run build
```

Then go to the `examples/` directory and install the dependencies (basically scimmy-routers):
```bash
$ cd examples/
$ npm install
```

## Setup the database

### Install Sqlite
First ensure that you have [sqlite3](http://sqlite3.org/) installed on your system. On Linux, you may install it using your package manager.

### Create the database

Then you may run this script to create the `test.db` database:
```bash
$ ./setup-db.sh
```

Or alternatively run the following commands:
```bash
$ sqlite3 test.db < ./structure.sql
$ sqlite3 test.db < ./data.sql
```

## Play with the SCIM server

### Query a single user

Query the user #2 using the `admin` account:

```bash
$ curl -H 'Authorization: Bearer api_key_admin' -v http://localhost:3000/scim/Users/2
```

### Get information about yourself (`/Me`)

Query yourself using the `user` account:
```bash
$ curl -H 'Authorization: Bearer api_key_user' -v http://localhost:3000/scim/Me
```

### Fetch all the users

Query all the users using the `admin` account:
```bash 
$ curl -H 'Authorization: Bearer api_key_admin' -v http://localhost:3000/scim/Users
```

### Insert a new user

```bash
$ curl -H 'Authorization: Bearer api_key_admin' -H 'Content-Type: application/scim+json' -X POST -d '{
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
$ curl -H 'Authorization: Bearer api_key_admin' -H 'Content-Type: application/scim+json' -X PUT -d '{
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
$ curl -v -H 'Authorization: Bearer api_key_admin' -H 'Content-Type: application/json' http://localhost:3000/scim/Users/1 -X PATCH -d '{
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
$ curl -v -H 'Authorization: Bearer api_key_admin' -H 'Content-Type: application/json' http://localhost:3000/scim/Bulk -X POST -d '{
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
        }' -H 'Content-Type: application/json' -X  POST 'http://localhost:3000/scim/Users/.search'
```

### Delete a user

Delete the user whose ID is `4`:

```bash
curl -H 'Authorization: Bearer api_key_admin' -v -X DELETE 'http://localhost:3000/scim/Users/4'
```
