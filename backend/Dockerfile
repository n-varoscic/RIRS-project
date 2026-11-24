# Docker slika za zagon backenda iz že zgrajene mape dist (artifact backend-dist iz CI)
# TypeScript se tu ne prevaja, namestijo se samo paketi, potrebni za zagon
FROM node:26-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY dist ./dist

# Render sam nastavi spremenljivko PORT, na kateri mora strežnik poslušati
CMD ["node", "dist/server.js"]
