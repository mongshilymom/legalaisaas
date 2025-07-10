const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'src/test/cypress/support/e2e.js',
    specPattern: 'src/test/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'src/test/cypress/fixtures',
    screenshotsFolder: 'src/test/cypress/screenshots',
    videosFolder: 'src/test/cypress/videos',
    downloadsFolder: 'src/test/cypress/downloads',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
    env: {
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'password123',
      STRIPE_PUBLISHABLE_KEY: 'pk_test_51234567890',
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
