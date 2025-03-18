#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Path to build directory
BUILD_DIR="./dist"

# Clean any existing build
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf ${BUILD_DIR}
mkdir -p ${BUILD_DIR}
mkdir -p ${BUILD_DIR}/frontend
mkdir -p ${BUILD_DIR}/backend

# Build frontend
echo -e "${BLUE}Building frontend...${NC}"
cd frontend
npm ci --production
npm run build
cp -r dist/* ../${BUILD_DIR}/frontend/
cd ..

# Build backend (exclude tests)
echo -e "${BLUE}Building backend...${NC}"
cd backend

# Create a virtual environment for the build
python -m venv build-venv
source build-venv/bin/activate

# Install dependencies and build
pip install wheel
pip install -e .

# Copy only the app directory and required files to the build
cp -r app ../${BUILD_DIR}/backend/
cp requirements.txt ../${BUILD_DIR}/backend/
cp .env.example ../${BUILD_DIR}/backend/.env.example

# Create a README file in the build directory
cat > ../${BUILD_DIR}/README.md << EOL
# Personal API Dashboard

## Setup

### Backend
1. Navigate to the \`backend\` directory
2. Create a virtual environment: \`python -m venv venv\`
3. Activate the virtual environment:
   - Windows: \`venv\\Scripts\\activate\`
   - Unix/MacOS: \`source venv/bin/activate\`
4. Install dependencies: \`pip install -r requirements.txt\`
5. Create a \`.env\` file from \`.env.example\`
6. Start the server: \`uvicorn app.main:app\`

### Frontend
1. Navigate to the \`frontend\` directory
2. Start the frontend: \`npx serve -s .\`
EOL

# Deactivate the virtual environment and clean up
deactivate
rm -rf build-venv

echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${BLUE}Production build is available in the '${BUILD_DIR}' directory${NC}" 