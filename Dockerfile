# use the Node.js 20 Alpine image
# This is a lightweight image suitable for production environments
FROM node:20.16.0-alpine

# Upgrade system packages to fix vulnerabilities
RUN apk upgrade --no-cache

# set the working directory in the container
WORKDIR /app

# copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Remove test directories and files
# RUN rm -rf tests/ test/ __tests__/ *.test.js *.spec.js playwright.config.js jest.config.js *.log

COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Start the application
CMD ["npm", "start"]