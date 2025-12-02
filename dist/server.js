import Fastify from 'fastify';
import autoLoad from '@fastify/autoload';
import path from 'node:path';
const loggerConfig = process.stdout.isTTY
    ? {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
            },
        },
        level: 'debug'
    }
    : { level: process.env.LOG_LEVEL || 'info' };
const server = Fastify({
    logger: loggerConfig
}).withTypeProvider();
server.register(autoLoad, {
    dir: path.join(import.meta.dirname, 'routes'),
});
export default server;
