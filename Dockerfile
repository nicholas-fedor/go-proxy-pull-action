FROM golang:1.25.1-alpine3.21@sha256:5149b521edf883f5cf4461c9b46a798c5e3d911fd4c192791593a1b0f653e8df

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
