const env = process.env;

export const nodeEnv = env.NODE_ENV || 'development';
export default {
  port: env.PORT || 8080,
  host: env.host || '0.0.0.0',
  get serverUrl(){
    return `${this.host}:${this.port}`;
  }
};
