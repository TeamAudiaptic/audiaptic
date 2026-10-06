import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { env } from './env';
import { APIUser, APIUserResponse201 } from './api-schemas/user.api.schema';
import { APIHelloWorld, APIHelloWorldResponse200 } from './api-schemas/helloWorld.api.schema';
import { performerRoute } from './sockets/routes/performer.route';

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
            version: '1.0.0',
        },
        servers: [
            {
                url: env.NODE_ENV === 'production' ? `https://${env.SITE_DOMAIN}` : `http://localhost:${env.PORT}`,
            },
        ],
    },
    transform: jsonSchemaTransform, // Crucial: Intercepts and transforms Zod schemas to OpenAPI formats
});

// 2. Register the Swagger UI interface (accessible locally at http://localhost:3000/docs)
app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
});

// Hello world route
app.route({
    method: 'GET',
    url: '/',
    schema: APIHelloWorld.route,
    handler: async (request, reply) => {
        const response: APIHelloWorldResponse200 = {
            message: 'Hello, world!',
        };
        return reply.status(200).send(response);
    }
});


app.register(performerRoute)
// Fastify must bind to 0.0.0.0 inside Docker containers
const start = async () => {
    try {
        // 3. Ensure plugins finish mounting, then write openapi.json file for Docusaurus
        await app.ready();
        const openapiSpec = JSON.stringify(app.swagger(), null, 2);
        fs.writeFileSync(path.join(process.cwd(), 'openapi.json'), openapiSpec);

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
