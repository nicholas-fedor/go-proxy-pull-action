FROM golang:1.25.2-alpine3.21@sha256:7300a8dde0097ef6391dad01ebec6d1730d2e52802436fcc6dcb130fc5aaba2a

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
