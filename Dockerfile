FROM keymetrics/pm2:8-stretch
CMD ["pm2-runtime", "start", "pm2.json"]
