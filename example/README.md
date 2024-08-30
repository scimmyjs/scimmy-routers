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

Query the user #2 using the `admin` account:

```bash
$ curl -H 'Authorization: Bearer api_key_admin' -v http://localhost:3000/scim/Users/2
```

Query yourself using the `user` account:
```bash
$ curl -H 'Authorization: Bearer api_key_user' -v http://localhost:3000/scim/Me
```

Query all the users using the `admin` account:
```bash 
$ curl -H 'Authorization: Bearer api_key_admin' -v http://localhost:3000/scim/Users
```

Insert a new user:
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

Update an existing user (adapt `ID` in the URL path):
```bash
curl -H 'Authorization: Bearer api_key_admin' -H 'Content-Type: application/scim+json' -X PUT -d '{
           "schemas": [
             "urn:ietf:params:scim:schemas:core:2.0:User"
           ],
           "userName": "bjensen@example.org",
           "name": {
             "formatted": "Ms. Barbara J Jensen III"
           },
           "emails": [
             {
               "value": "bjensen@example.org",
               "primary": true
             },{
               "value": "bjensen2@example.org",
               "primary": false
             }
           ]
         }' -v http://localhost:3000/scim/Users/ID
```
