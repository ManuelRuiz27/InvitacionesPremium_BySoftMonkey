import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';

interface CsvRow {
    fullName: string;
    phone?: string;
    email?: string;
    guestCount: string;
}

interface ImportResult {
    created: number;
    skipped: number;
    invalid: number;
    errors: Array<{
        row: number;
        data: CsvRow;
        reason: string;
    }>;
    summary: {
        totalRows: number;
        successRate: number;
    };
}

/**
 * CSV Import Service for bulk guest creation
 * Validates: guestCount 1-10, max 1000 guests per event
 * Deduplicates by phone or email
 */
@Injectable()
export class CsvImportService {
    constructor(private prisma: PrismaService) { }

    /**
     * Import guests from CSV file
     * @param eventId - Event to import guests into
     * @param fileBuffer - CSV file buffer
     * @param plannerId - Planner ID for ownership verification
     */
    async importGuests(
        eventId: string,
        fileBuffer: Buffer,
        plannerId: string,
    ): Promise<ImportResult> {
        // Verify event exists and belongs to planner
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                _count: {
                    select: { guests: true },
                },
            },
        });

        if (!event) {
            throw new BadRequestException('Event not found');
        }

        if (event.plannerId !== plannerId) {
            throw new BadRequestException('You do not have access to this event');
        }

        // Parse CSV
        const rows: CsvRow[] = [];
        const stream = Readable.from(fileBuffer.toString());

        await new Promise<void>((resolve, reject) => {
            stream
                .pipe(csvParser())
                .on('data', (row: CsvRow) => rows.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        if (rows.length === 0) {
            throw new BadRequestException('CSV file is empty');
        }

        // Check total guest limit
        const currentGuestCount = event._count.guests;
        const potentialTotal = currentGuestCount + rows.length;

        if (potentialTotal > event.maxGuests) {
            throw new BadRequestException(
                `Cannot import ${rows.length} guests. Would exceed maximum of ${event.maxGuests} guests per event. Current: ${currentGuestCount}`,
            );
        }

        // Process rows
        const result: ImportResult = {
            created: 0,
            skipped: 0,
            invalid: 0,
            errors: [],
            summary: {
                totalRows: rows.length,
                successRate: 0,
            },
        };

        // Get existing guests for deduplication
        const existingGuests = await this.prisma.guest.findMany({
            where: { eventId },
            select: { phone: true, email: true },
        });

        const existingPhones = new Set(
            existingGuests.map((g) => g.phone).filter(Boolean),
        );
        const existingEmails = new Set(
            existingGuests.map((g) => g.email).filter(Boolean),
        );

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // +2 because CSV is 1-indexed and has header

            // Validate row
            const validation = this.validateRow(row, rowNumber);
            if (!validation.valid) {
                result.invalid++;
                result.errors.push({
                    row: rowNumber,
                    data: row,
                    reason: validation.reason!,
                });
                continue;
            }

            // Check for duplicates
            const isDuplicate =
                (row.phone && existingPhones.has(row.phone)) ||
                (row.email && existingEmails.has(row.email));

            if (isDuplicate) {
                result.skipped++;
                result.errors.push({
                    row: rowNumber,
                    data: row,
                    reason: 'Duplicate phone or email',
                });
                continue;
            }

            // Create guest
            try {
                await this.prisma.guest.create({
                    data: {
                        fullName: row.fullName.trim(),
                        phone: row.phone?.trim() || null,
                        email: row.email?.trim() || null,
                        guestCount: parseInt(row.guestCount, 10),
                        eventId,
                    },
                });

                result.created++;

                // Add to existing sets to prevent duplicates within the same import
                if (row.phone) existingPhones.add(row.phone);
                if (row.email) existingEmails.add(row.email);
            } catch (error) {
                result.invalid++;
                result.errors.push({
                    row: rowNumber,
                    data: row,
                    reason: `Database error: ${error.message}`,
                });
            }
        }

        // Calculate success rate
        result.summary.successRate =
            rows.length > 0 ? (result.created / rows.length) * 100 : 0;

        return result;
    }

    /**
     * Validate a CSV row
     */
    private validateRow(
        row: CsvRow,
        rowNumber: number,
    ): { valid: boolean; reason?: string } {
        // Check required fields
        if (!row.fullName || row.fullName.trim() === '') {
            return { valid: false, reason: 'Missing fullName' };
        }

        if (!row.guestCount) {
            return { valid: false, reason: 'Missing guestCount' };
        }

        // Validate guestCount
        const guestCount = parseInt(row.guestCount, 10);
        if (isNaN(guestCount)) {
            return { valid: false, reason: 'guestCount must be a number' };
        }

        if (guestCount < 1 || guestCount > 10) {
            return { valid: false, reason: 'guestCount must be between 1 and 10' };
        }

        // At least phone or email required
        if (!row.phone && !row.email) {
            return {
                valid: false,
                reason: 'At least phone or email is required',
            };
        }

        // Basic email validation
        if (row.email && !this.isValidEmail(row.email)) {
            return { valid: false, reason: 'Invalid email format' };
        }

        // Basic phone validation (allow various formats)
        if (row.phone && row.phone.trim().length < 10) {
            return {
                valid: false,
                reason: 'Phone number must be at least 10 digits',
            };
        }

        return { valid: true };
    }

    /**
     * Simple email validation
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generate CSV template
     */
    generateTemplate(): string {
        return 'fullName,phone,email,guestCount\n' +
            'Juan Pérez,5512345678,juan@example.com,2\n' +
            'María García,5587654321,maria@example.com,1\n';
    }
}
