import { describe, it, expect } from 'vitest';
import { getAvatarUrl } from './imageUtils';

describe('imageUtils', () => {
    describe('getAvatarUrl', () => {
        it('deve retornar null para valores inválidos', () => {
            expect(getAvatarUrl(null)).toBeNull();
            expect(getAvatarUrl(undefined)).toBeNull();
            expect(getAvatarUrl('')).toBeNull();
        });

        it('deve retornar URL completo se começar com http', () => {
            const httpUrl = 'http://example.com/avatar.jpg';
            const httpsUrl = 'https://example.com/avatar.jpg';

            expect(getAvatarUrl(httpUrl)).toBe(httpUrl);
            expect(getAvatarUrl(httpsUrl)).toBe(httpsUrl);
        });

        it('deve adicionar prefixo do servidor para paths relativos', () => {
            expect(getAvatarUrl('/uploads/avatar.jpg'))
                .toBe('http://localhost:5000/uploads/avatar.jpg');

            expect(getAvatarUrl('uploads/avatar.jpg'))
                .toBe('http://localhost:5000/uploads/avatar.jpg');
        });
    });
});
