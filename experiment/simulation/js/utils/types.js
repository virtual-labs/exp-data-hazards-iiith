// js/utils/types.js

// Pipeline Stages
const PIPELINE_STAGES = ['Fetch', 'Decode', 'Execute', 'Memory', 'Writeback'];

// Instruction Types
const INSTRUCTION_TYPES = ['ADD', 'SUB', 'MUL', 'DIV', 'LOAD', 'STORE'];
const MEMORY_INSTRUCTIONS = ['LOAD', 'STORE'];
const COMPUTE_INSTRUCTIONS = ['ADD', 'SUB', 'MUL', 'DIV'];

// Hazard Types
const HAZARD_TYPES = ['RAW', 'WAW', 'Structural'];

// Register Configuration
const MAX_REGISTERS = 32;
const REGISTERS = Array.from(
    { length: MAX_REGISTERS }, 
    (_, i) => `R${i}`
);

// Default Latencies
const DEFAULT_LATENCIES = {
    ADD: { execute: 1, memory: 1 },
    SUB: { execute: 1, memory: 1 },
    MUL: { execute: 3, memory: 1 },
    DIV: { execute: 4, memory: 1 },
    LOAD: { execute: 1, memory: 2 },
    STORE: { execute: 1, memory: 2 }
};

// Stage Availability Configuration
const STAGE_AVAILABILITY = {
    READ: {
        'ADD': 'Decode',
        'SUB': 'Decode',
        'MUL': 'Decode',
        'DIV': 'Decode',
        'LOAD': 'Decode',
        'STORE': 'Decode'
    },
    WRITE: {
        'ADD': 'Writeback',
        'SUB': 'Writeback',
        'MUL': 'Writeback',
        'DIV': 'Writeback',
        'LOAD': 'Writeback',
        'STORE': 'Memory'  // STORE completes in Memory stage
    }
};

// Helper Functions
function isMemoryInstruction(type) {
    return MEMORY_INSTRUCTIONS.includes(type);
}

function isComputeInstruction(type) {
    return COMPUTE_INSTRUCTIONS.includes(type);
}

function getStageIndex(stage) {
    return PIPELINE_STAGES.indexOf(stage);
}

function formatInstruction(instruction) {
    if (instruction.type === 'LOAD') {
        return `${instruction.type} ${instruction.rd}, ${instruction.offset}(${instruction.rs1})`;
    } else if (instruction.type === 'STORE') {
        return `${instruction.type} ${instruction.rs2}, ${instruction.offset}(${instruction.rs1})`;
    } else {
        return `${instruction.type} ${instruction.rd}, ${instruction.rs1}, ${instruction.rs2}`;
    }
}

// Export all constants and functions
export {
    PIPELINE_STAGES,
    INSTRUCTION_TYPES,
    MEMORY_INSTRUCTIONS,
    COMPUTE_INSTRUCTIONS,
    HAZARD_TYPES,
    MAX_REGISTERS,
    REGISTERS,
    DEFAULT_LATENCIES,
    STAGE_AVAILABILITY,
    isMemoryInstruction,
    isComputeInstruction,
    getStageIndex,
    formatInstruction
};
