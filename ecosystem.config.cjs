module.exports = {
  apps: [
    {
      name: "translate-app-admin",
      cwd: __dirname,
      script: "serve",
      env: {
        PM2_SERVE_PATH: "dist",
        PM2_SERVE_PORT: 5024,
        PM2_SERVE_SPA: "true",
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
    },
  ],
};
