#!/bin/bash

set -euEo pipefail

sqlite3=$(which sqlite3)
script_dir=$(dirname $0)
database="${script_dir}/test.db"

help=false
force=false

# Parse the arguments
while [ $# -gt 0 ]; do
    case $1 in
        --help)
            help=true
            ;;
        --force)
            force=true
            ;;
        *)
            echo "Unknown argument: $1"
            exit 1
            ;;
    esac
    shift
done

if [ "$help" == "true" ]; then
    echo "Usage: ./setup-db.sh [--help] [--force]"
    echo "This script will create a database with sqlite3 and feed it with the data."
    exit 0
fi

if [ -z $sqlite3 ]; then
    echo "sqlite3 is not installed!"
    echo "Please install sqlite3 before running the script."
    exit 1
fi

if [ -f "$database" ]; then
    if [ "$force" == "true" ]; then
        rm "$database"
    else
        echo "Database already exists!"
        echo "Please remove the existing database before running the script. Or use the --force option to remove it automatically."
        exit 1
    fi
fi

# Create a database with sqlite3 
$sqlite3 "$database" < "${script_dir}/structure.sql"
# Feed the database with the data
$sqlite3 "$database" < "${script_dir}/data.sql"

echo "Database setup complete! The database is created at $database"
