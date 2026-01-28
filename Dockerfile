FROM golang:1.25-alpine@sha256:9f7db8d8d90904f8347c1f833dea4c51f9e66d54aab87e15ba128bb03f2ac82a

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
