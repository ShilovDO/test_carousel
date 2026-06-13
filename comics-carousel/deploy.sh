#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment...${NC}"

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Останавливаем старые контейнеры
echo -e "${YELLOW}🧹 Stopping old containers...${NC}"
docker-compose down

# Собираем образы
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose build --no-cache

# Запускаем контейнеры
echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose up -d

# Проверяем статус
echo -e "${YELLOW}📊 Checking status...${NC}"
sleep 5
docker-compose ps

# Проверяем логи на наличие ошибок
echo -e "${YELLOW}📝 Checking logs for errors...${NC}"
if docker-compose logs backend | grep -i error; then
    echo -e "${RED}❌ Errors found in backend logs${NC}"
else
    echo -e "${GREEN}✅ Backend started successfully${NC}"
fi

# Проверяем доступность API
echo -e "${YELLOW}🔍 Testing API connectivity...${NC}"
sleep 3
if curl -s http://localhost/api/images > /dev/null; then
    echo -e "${GREEN}✅ API is accessible${NC}"
else
    echo -e "${RED}❌ API is not accessible${NC}"
fi

echo -e "${GREEN}✨ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Frontend: http://localhost${NC}"
echo -e "${GREEN}🔗 API: http://localhost/api${NC}"
echo -e "${YELLOW}📋 To view logs: docker-compose logs -f${NC}"