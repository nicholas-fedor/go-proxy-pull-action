FROM golang:1.25-alpine@sha256:f4622e3bed9b03190609db905ac4b02bba2368ba7e62a6ad4ac6868d2818d314

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
