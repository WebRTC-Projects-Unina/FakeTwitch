# --- FASE 1: Compilazione (Build) con Node.js ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copia i file delle dipendenze e le installa
COPY package*.json ./
RUN npm install

# Copia il resto del codice sorgente e compila la build di produzione
COPY . .
RUN npm run build

# --- FASE 2: Server Web di Produzione con Nginx ---
FROM nginx:alpine

# Copia i file compilati dalla fase precedente nella cartella pubblica di Nginx
COPY --from=builder /app/dist /usr/share/nginx/html


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]