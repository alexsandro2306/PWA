import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Adicionar matchers do jest-dom
expect.extend(matchers);

// Limpar após cada teste
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// Mock do localStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        })
    };
})();
global.localStorage = localStorageMock;

// Mock do window.location
try {
    // Only delete if configurable, otherwise just modify properties if possible or leave as is if jsdom handles it
    delete window.location;
    window.location = {
        href: '',
        pathname: '/',
        search: '',
        hash: ''
    };
} catch (e) {
    console.log('Error mocking window.location:', e);
}

// Mock do matchMedia (para testes responsivos)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
