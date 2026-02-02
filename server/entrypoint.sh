#!/bin/sh
set -e

node src/migrate.js
node src/index.js
