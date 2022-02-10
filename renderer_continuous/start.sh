#!/bin/bash

if [ ! -f .htpasswd ]; then
  echo Setup authentication
  echo Insert username:
  read username
  htpasswd -c .htpasswd $username
fi

docker-compose up -d
