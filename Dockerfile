FROM golang:1.25.3-alpine3.21@sha256:2c9684db68f1b6e76a500fdb1ea9af6288725b7f3ef47aa3265195d3ed5a8326

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
