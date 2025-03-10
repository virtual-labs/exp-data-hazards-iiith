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
    // When source operands are read
    READ: {
        'ADD': 'Decode',
        'SUB': 'Decode',
        'MUL': 'Decode',
        'DIV': 'Decode',
        'LOAD': 'Decode',
        'STORE': 'Decode'
    },
    // When destination is written
    WRITE: {
        'ADD': 'Writeback',
        'SUB': 'Writeback',
        'MUL': 'Writeback',
        'DIV': 'Writeback',
        'LOAD': 'Writeback',
        'STORE': 'Memory'  // STORE completes in Memory stage
    },
    // When results are available with forwarding
    FORWARDING_RESULT_AVAILABLE: {
        'ADD': 'Execute',
        'SUB': 'Execute',
        'MUL': 'Execute',
        'DIV': 'Execute', 
        'LOAD': 'Memory',
        'STORE': null  // STORE doesn't produce a register result
    }
};

// Register File Timing
const REGISTER_FILE_TIMING = {
    // Register file allows write in first half of cycle, read in second half
    WRITE_BEFORE_READ_SAME_CYCLE: true
};

// Forwarding Configuration
const FORWARDING_CONFIG = {
    // Special cases for operand timing with forwarding
    OPERAND_NEEDED_STAGE: {
        'STORE': {
            'rs2': 'Memory'    // Value to store needed at Memory
        }
    },

    DEFAULT_OPERAND_NEEDED_STAGE: PIPELINE_STAGES[2] // Execute
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
    if (!instruction || !instruction.type) {
        return 'Invalid instruction';
    }
    
    if (instruction.type === 'LOAD') {
        return `${instruction.type} ${instruction.rd || '?'}, ${instruction.offset || '0'}(${instruction.rs1 || '?'})`;
    } else if (instruction.type === 'STORE') {
        return `${instruction.type} ${instruction.rs2 || '?'}, ${instruction.offset || '0'}(${instruction.rs1 || '?'})`;
    } else {
        return `${instruction.type} ${instruction.rd || '?'}, ${instruction.rs1 || '?'}, ${instruction.rs2 || '?'}`;
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
    REGISTER_FILE_TIMING,
    FORWARDING_CONFIG,
    isMemoryInstruction,
    isComputeInstruction,
    getStageIndex,
    formatInstruction
};