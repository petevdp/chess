#!/usr/bin/fish
ssh-keygen -t rsa -b 4096 -m PEM -f secrets/jwtRS256.key

openssl rsa -in secrets/jwtRS256.key -pubout -outform PEM -out secrets/jwtRS256.key.pub
