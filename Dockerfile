FROM golang:1.25.0-alpine3.21@sha256:c8e1680f8002c64ddfba276a3c1f763097cb182402673143a89dcca4c107cf17

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
