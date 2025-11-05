FROM golang:1.25.4-alpine3.21@sha256:1b84283ebeef726bc5fa9fec8deb36828aabfa12fe3a28b4fb0a4b2eafafe38c

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
