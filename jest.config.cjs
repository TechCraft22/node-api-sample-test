// export default {
//   testEnvironment: 'node',  
//   setupFilesAfterEnv: [],
//   testMatch: ['**/*.test.js'],
//   transform: {}, //prevent babel issue with jest
// };

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [],
  testMatch: ['**/*.test.js'],
  transform: {}, // prevent babel issue with jest
};
// Note: The above code is a Jest configuration file that sets up the testing environment for Node.js applications. It specifies that tests should run in a Node environment, includes setup files to run after the environment is set up, matches test files with the `.test.js` suffix, and prevents Babel-related issues by not transforming the code.
// This configuration is essential for running tests in a Node.js application, ensuring that the testing framework