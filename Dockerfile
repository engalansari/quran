FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates chromium curl fontconfig fonts-dejavu-core pango1.0-tools xz-utils \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -o /tmp/ffmpeg.tar.xz \
  && mkdir -p /opt/ffmpeg \
  && tar -xJf /tmp/ffmpeg.tar.xz -C /opt/ffmpeg --strip-components=1 \
  && ln -s /opt/ffmpeg/ffmpeg /usr/local/bin/ffmpeg \
  && ln -s /opt/ffmpeg/ffprobe /usr/local/bin/ffprobe \
  && ffmpeg -hide_banner -version \
  && rm -f /tmp/ffmpeg.tar.xz

WORKDIR /app

RUN mkdir -p /usr/local/share/fonts/ayah
COPY assets/fonts/hafs.18.ttf /usr/local/share/fonts/ayah/KFGQPCHAFSUthmanicScript-Regula.ttf
RUN fc-cache -f -v /usr/local/share/fonts/ayah

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV FFMPEG=ffmpeg
ENV FFPROBE=ffprobe
ENV CHROMIUM=chromium
ENV PANGO_VIEW=pango-view
ENV QURAN_TEXT_RENDERER=pango

EXPOSE 8080

CMD ["node", "scripts/serve-mobile-backend.mjs", "--host", "0.0.0.0"]
