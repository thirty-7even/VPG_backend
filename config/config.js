// SET UP TEST DATABASE
var env = process.env.NODE_ENV || 'production';
console.log('ENVIRONMENT: ', env);

if (env === 'development') {
	process.env.PORT = 8080;
	process.env.MONGODB_URI = 'mongodb://localhost:27017/VGPLocal';
} else if (env === 'production') {
	process.env.PORT = 8080;
	process.env.MONGODB_URI = '';
} else if (env === 'test') {
	process.env.PORT = 8080;
	process.env.MONGODB_URI = 'mongodb://localhost:27017/VGPTest';
}
