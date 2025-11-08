import { createDefaultPreset } from 'ts-jest'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    testEnvironment: 'node',
    transform: {
        ...createDefaultPreset().transform,
    },
    extensionsToTreatAsEsm: ['.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
}
