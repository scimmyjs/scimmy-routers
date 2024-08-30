#!/bin/bash

sqlite3=$(which sqlite3)
if [ -z $sqlite3 ]; then
    echo "sqlite3 is not installed!"
    echo "Please install sqlite3 before running the script."
    exit 1
fi

if [ -f test.db ]; then
    echo "Database already exists!"
    echo "Please remove the existing database before running the script."
    exit 1
fi

# Create a database with sqlite3 
$sqlite3 test.db < ./structure.sql
# Feed the database with the data
$sqlite3 test.db < ./data.sql

echo "Database setup complete!"
