FROM golang:1.24.5-alpine3.21@sha256:72ff633a5298088a576d505c51630257cf1f681fc64cecddfb5234837eb4a747

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
