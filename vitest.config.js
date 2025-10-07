import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.js'],
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium',
          launch: {
            executablePath: '/usr/bin/chromium-browser'
          }
        }
      ]
    }
  }
})
