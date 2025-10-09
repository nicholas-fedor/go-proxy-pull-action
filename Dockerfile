FROM golang:1.25.2-alpine3.21@sha256:5ea2a92bd01024ea2e0a6daa8c57639835bddbec87c0e6b30332008d37424596

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
