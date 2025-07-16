FROM golang:1.24.5-alpine3.21@sha256:42b91b1364b79204d9b421e03487efbe73d267211d8e24d8755234ba578451e4

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
