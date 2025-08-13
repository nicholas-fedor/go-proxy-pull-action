FROM golang:1.25.0-alpine3.21@sha256:9030d461ce2f9586ad6fac3c17607b3fb3df38c7d9f6e567aa05ea716fb107d8

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
