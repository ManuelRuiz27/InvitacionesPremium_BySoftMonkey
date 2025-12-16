import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './src/app.module';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { stringify } from 'yaml';

async function generateOpenApi() {
    const app = await NestFactory.create(AppModule, { logger: false });

    const config = new DocumentBuilder()
        .setTitle('Monotickets Platinum API')
        .setDescription('API oficial para Monotickets Platinum (invited events, RSVPs, delivery y scanner).')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    const yamlDocument = stringify(document);

    const outputDir = path.join(process.cwd(), 'docs', 'contracts');
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'OPENAPI_monotickets.yaml');
    await fs.writeFile(outputPath, yamlDocument, 'utf8');

    await app.close();
    Logger.log(`OpenAPI spec generated at ${outputPath}`, 'generate-openapi');
}

generateOpenApi().catch((err) => {
    Logger.error(err, 'generate-openapi');
    process.exit(1);
});
