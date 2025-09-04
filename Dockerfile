FROM golang:1.25.1-alpine3.21@sha256:a887c10a9b55f54d0880df6abd841625a7733e7e1cd4442bd099edde63ea5d78

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
