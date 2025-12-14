import { Injectable } from '@nestjs/common';

/**
 * Base interface for delivery providers (SMS, WhatsApp)
 */
export interface DeliveryProvider {
    /**
     * Send a message via this provider
     * @param to - Phone number in E.164 format
     * @param message - Message content
     * @param metadata - Additional metadata (invitation ID, event ID, etc.)
     * @returns Success status and provider-specific response
     */
    send(
        to: string,
        message: string,
        metadata?: Record<string, any>,
    ): Promise<DeliveryResult>;

    /**
     * Get provider name
     */
    getName(): string;

    /**
     * Check if provider is available/configured
     */
    isAvailable(): boolean;
}

export interface DeliveryResult {
    success: boolean;
    providerId?: string; // Provider's message ID
    error?: string;
    invalidNumber?: boolean; // True if provider indicates number is invalid
}

/**
 * Mock SMS Provider for testing
 */
@Injectable()
export class MockSmsProvider implements DeliveryProvider {
    getName(): string {
        return 'MOCK_SMS';
    }

    isAvailable(): boolean {
        return true;
    }

    async send(
        to: string,
        message: string,
        metadata?: Record<string, any>,
    ): Promise<DeliveryResult> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Simulate 95% success rate
        const success = Math.random() > 0.05;

        // Simulate invalid number detection (1% of attempts)
        const invalidNumber = Math.random() < 0.01;

        if (invalidNumber) {
            return {
                success: false,
                error: 'Invalid phone number',
                invalidNumber: true,
            };
        }

        if (success) {
            return {
                success: true,
                providerId: `MOCK_SMS_${Date.now()}`,
            };
        }

        return {
            success: false,
            error: 'Temporary network error',
        };
    }
}

/**
 * Mock WhatsApp Provider for testing
 */
@Injectable()
export class MockWhatsAppProvider implements DeliveryProvider {
    getName(): string {
        return 'MOCK_WHATSAPP';
    }

    isAvailable(): boolean {
        return true;
    }

    async send(
        to: string,
        message: string,
        metadata?: Record<string, any>,
    ): Promise<DeliveryResult> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Simulate 95% success rate
        const success = Math.random() > 0.05;

        // Simulate invalid number detection (1% of attempts)
        const invalidNumber = Math.random() < 0.01;

        if (invalidNumber) {
            return {
                success: false,
                error: 'WhatsApp number not registered',
                invalidNumber: true,
            };
        }

        if (success) {
            return {
                success: true,
                providerId: `MOCK_WA_${Date.now()}`,
            };
        }

        return {
            success: false,
            error: 'WhatsApp service temporarily unavailable',
        };
    }
}
