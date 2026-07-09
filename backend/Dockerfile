FROM node:22-alpine

# The system `ping` binary is what pingCheck.js shells out to for ICMP
# checks. iputils provides it explicitly rather than relying on whatever
# busybox applet the base image happens to ship. The container runs as
# root (no USER directive) specifically so raw ICMP sockets work without
# extra --cap-add flags; see README for the non-root alternative.
RUN apk add --no-cache iputils

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -q -O - http://localhost:4000/api/health || exit 1

CMD ["node", "src/index.js"]
