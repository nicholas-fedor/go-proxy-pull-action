FROM golang:1.25.2-alpine3.21@sha256:b34e174bf963e0e109b0abc0e60f5b8319240084b3623dd131a89cd48f597f8d

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
