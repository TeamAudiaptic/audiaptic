import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fs from 'fs';
import path from 'path';
import { env } from './env';
import { performerRoute } from './sockets/routes/performer.route';
import { helloWorldRoute } from './routes/helloWorld.route';
import { buildAsyncApiSpec } from './docs/asyncapi';

const isProd = env.NODE_ENV === 'production';

const app = Fastify({
    logger: true,
}).withTypeProvider<ZodTypeProvider>();

// Set up Zod validation compilers for Fastify
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(fastifyWebsocket)
// 1. Register the core Swagger plugin
app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Distributed Audio-Visual-Haptic Interface Server API',
            description:
                'REST routes for the server. Performer events are sent over WebSocket at `/api/performer` ' +
                'and are documented separately on the **WebSocket API** page.',
            version: '1.0.0',
        },
        // Requests come in through Caddy, which forwards /api/* to this app
        servers: [
            {
                url: `${isProd ? 'https' : 'http'}://${env.SITE_DOMAIN}`,
            },
        ],
    },
    transform: jsonSchemaTransform, // Crucial: Intercepts and transforms Zod schemas to OpenAPI formats
});

// 2. Register the Swagger UI interface (accessible locally at http://localhost/api/docs)
app.register(fastifySwaggerUi, {
    routePrefix: '/api/docs',
});

// Caddy forwards /api/* to this app without stripping the prefix,
// so every route has to live under /api too
app.register(performerRoute, { prefix: '/api' });
app.register(helloWorldRoute, { prefix: '/api' });
// Fastify must bind to 0.0.0.0 inside Docker containers
const start = async () => {
    try {
        // 3. Ensure plugins finish mounting, then write openapi.json file for Docusaurus
        await app.ready();
        const openapiSpec = JSON.stringify(app.swagger(), null, 2);
        fs.writeFileSync(path.join(process.cwd(), 'openapi.json'), openapiSpec);

        // OpenAPI can't describe WebSocket routes, so the sockets get an AsyncAPI spec
        const asyncapiSpec = buildAsyncApiSpec(env.SITE_DOMAIN, isProd ? 'wss' : 'ws');
        fs.writeFileSync(path.join(process.cwd(), 'asyncapi.json'), JSON.stringify(asyncapiSpec, null, 2));

        if (process.argv.includes('--export-schema')) {
            app.log.info('Schema exported successfully. Exiting.');
            process.exit(0); // Exit cleanly without starting app.listen()
        }

        await app.listen({ port: env.PORT, host: '0.0.0.0' });

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }

};

start();
