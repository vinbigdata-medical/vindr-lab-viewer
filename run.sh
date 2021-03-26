#!/bin/bash

PREFIX=${PUBLIC_URL:-"/medical-view/"}
cd /usr/src/app
yarn run build
len=${#PREFIX}
echo $PREFIX
echo $len
DIST_PATH=${PREFIX:1:(len-1)}
mkdir /var/www/html/$DIST_PATH
cp -r /usr/src/app/platform/viewer/dist/*  /var/www/html/$DIST_PATH
nginx -g "daemon off;"
