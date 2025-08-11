# Étape 1 : construire l'app
FROM node:18-alpine AS builder
WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le code
COPY . .

# Build Next.js
RUN NEXT_DISABLE_ESLINT=1 npm run build


# Étape 2 : exécuter l'app
FROM node:18-alpine
WORKDIR /app

# Copier les fichiers nécessaires du builder
COPY --from=builder /app ./

EXPOSE 3000

# Lancer Next.js
CMD ["npm", "start"]
