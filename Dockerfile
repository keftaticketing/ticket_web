# syntax=docker/dockerfile:1

FROM node:26-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Theme assets are a git submodule; fetch them when not initialized locally.
RUN apk add --no-cache git \
    && if [ ! -f src/assets/styles.scss ]; then \
        rm -rf src/assets \
        && git clone https://github.com/cetincakiroglu/sakai-assets.git src/assets \
        && git -C src/assets checkout eaa70ece4cfa9aeb8f60b36dce5a422b6bae8003; \
    fi

ARG API_URL=https://YOUR_API_HOST/api
ARG CLIENT_ID=ticket-admin
ARG CLIENT_KEY=YOUR_CLIENT_KEY

RUN cat > src/environments/environment.ts <<EOF
import { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
    production: true,
    name: 'production',
    apiUrl: '${API_URL}',
    clientId: '${CLIENT_ID}',
    clientKey: '${CLIENT_KEY}'
};
EOF

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/sakai-ng/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
