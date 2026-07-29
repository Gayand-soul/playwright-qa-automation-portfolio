FROM mcr.microsoft.com/playwright:v1.61.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN sed -i 's/\r$//' run-tests.sh && chmod +x run-tests.sh

CMD ["./run-tests.sh"]