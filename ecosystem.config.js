module.exports = {
  apps: [
    {
      name: 'solar-api',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/app/logs/err.log',
      out_file: '/app/logs/out.log',
      log_file: '/app/logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
    },
  ],
};
