FROM golang:1.25.2-alpine3.21@sha256:0ae17b3ad9583fcc9c2b195d12f2aa5dd1c18380d3827bd1a81c6e52aded353c

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
