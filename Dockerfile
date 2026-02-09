FROM ubuntu:noble

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates media-types mailcap tzdata \
    && rm -rf /var/lib/apt/lists/*

ARG PUID=2000
ARG PGID=2000

RUN groupadd --gid ${PGID} mattermost \
    && useradd --uid ${PUID} --gid ${PGID} --home-dir /mattermost mattermost

COPY --chown=2000:2000 mattermost /mattermost

RUN mkdir -p /mattermost/data /mattermost/plugins /mattermost/client/plugins /mattermost/logs /mattermost/config \
    && chown -R mattermost:mattermost /mattermost

ENV PATH="/mattermost/bin:${PATH}"
ENV MM_INSTALL_TYPE=docker

USER mattermost

HEALTHCHECK --interval=30s --timeout=10s \
    CMD ["/mattermost/bin/mmctl", "system", "status", "--local"]

WORKDIR /mattermost
CMD ["/mattermost/bin/mattermost"]

EXPOSE 8065 8067 8074 8075

VOLUME ["/mattermost/data", "/mattermost/logs", "/mattermost/config", "/mattermost/plugins", "/mattermost/client/plugins"]
