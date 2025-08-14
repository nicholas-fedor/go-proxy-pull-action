FROM golang:1.25.0-alpine3.21@sha256:a92c1ab0ec17377c238fc4e21a404e3dc2e5e5bb54d3007ef35d576827da5f63

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
