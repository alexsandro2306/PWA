import { describe, it, expect } from 'vitest';
import {
    validateEmail,
    validatePassword,
    validatePhone,
    validateUsername
} from './validation';

describe('Validation Utils', () => {
    describe('validateEmail', () => {
        it('deve aceitar emails válidos', () => {
            expect(validateEmail('user@example.com')).toBe(true);
            expect(validateEmail('test.user@domain.co.uk')).toBe(true);
            expect(validateEmail('name+tag@email.com')).toBe(true);
        });

        it('deve rejeitar emails inválidos', () => {
            expect(validateEmail('')).toBe(false);
            expect(validateEmail('invalid')).toBe(false);
            expect(validateEmail('@example.com')).toBe(false);
            expect(validateEmail('user@')).toBe(false);
            expect(validateEmail('user @example.com')).toBe(false);
        });
    });

    describe('validatePassword', () => {
        it('deve aceitar passwords válidas', () => {
            expect(validatePassword('123456')).toBe(true);
            expect(validatePassword('longpassword')).toBe(true);
            expect(validatePassword('P@ssw0rd!')).toBe(true);
        });

        it('deve rejeitar passwords inválidas', () => {
            expect(validatePassword('')).toBe(false);
            expect(validatePassword('12345')).toBe(false);
            expect(validatePassword('short')).toBe(false);
        });
    });

    describe('validatePhone', () => {
        it('deve aceitar números válidos', () => {
            expect(validatePhone('+351 912 345 678')).toBe(true);
            expect(validatePhone('912345678')).toBe(true);
            expect(validatePhone('+351912345678')).toBe(true);
            expect(validatePhone('(912) 345-678')).toBe(true);
        });

        it('deve aceitar vazio (campo opcional)', () => {
            expect(validatePhone('')).toBe(true);
            expect(validatePhone(null)).toBe(true);
        });

        it('deve rejeitar formatos inválidos', () => {
            expect(validatePhone('abc')).toBe(false);
            expect(validatePhone('123abc')).toBe(false);
        });
    });

    describe('validateUsername', () => {
        it('deve aceitar usernames válidos', () => {
            expect(validateUsername('joao_silva')).toBe(true);
            expect(validateUsername('user123')).toBe(true);
            expect(validateUsername('test_user_2024')).toBe(true);
        });

        it('deve rejeitar usernames inválidos', () => {
            expect(validateUsername('')).toBe(false);
            expect(validateUsername('ab')).toBe(false);
            expect(validateUsername('user name')).toBe(false);
            expect(validateUsername('user-name')).toBe(false);
            expect(validateUsername('user@name')).toBe(false);
        });
    });
});
