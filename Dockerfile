FROM golang:1.24.6-alpine3.21@sha256:50f8a10a46c0c26b5b816a80314f1999196c44c3e3571f41026b061339c29db6

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
