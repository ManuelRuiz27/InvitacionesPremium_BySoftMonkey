import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const guests = await prisma.guest.findMany({
        include: { invitations: true }
    });

    const outputLines = guests.map(g => {
        const inviteId = g.invitations[0]?.id || 'No invitation';
        return `Guest: ${g.fullName} | InviteID: ${inviteId} | Status: ${g.invitations[0]?.status}`;
    });

    const outputPath = 'C:/Users/ruiz_/.gemini/antigravity/brain/1afb3767-ee5b-48c9-8cc5-c75e5aad214e/test_data.txt';
    fs.writeFileSync(outputPath, outputLines.join('\n'));
    console.log(`Data written to ${outputPath}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
