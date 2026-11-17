FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

WORKDIR /app
ARG ACIONA_REVISION=local
ENV ACIONA_REVISION=${ACIONA_REVISION}
ENV PORT=3000

COPY --chown=node:node server.mjs ./
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
