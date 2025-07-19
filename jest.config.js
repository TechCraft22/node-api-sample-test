export default {
  testEnvironment: 'node',  
  setupFilesAfterEnv: [],
  testMatch: ['**/*.test.js'],
  transform: {}, //prevent babel issue with jest
};