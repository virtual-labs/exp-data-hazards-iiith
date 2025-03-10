// js/utils/registerSets.js
import { INSTRUCTION_TYPES, MAX_REGISTERS } from './types.js';

/**
 * Validates if a register name is in the correct format (R0-R31)
 * @param {string} reg - Register name to validate
 * @returns {boolean} boolean indicating if register name is valid
 */
function isValidRegister(reg) {
    return typeof reg === 'string' && 
           /^R[0-9]+$/.test(reg) && 
           parseInt(reg.slice(1)) >= 0 && 
           parseInt(reg.slice(1)) < MAX_REGISTERS;
}

/**
 * Gets the read and write register sets for an instruction
 * @param {Object} instruction - Instruction to analyze
 * @returns {Object} Object containing readSet and writeSet
 */
function getRegisterSets(instruction) {
    const readSet = [];
    const writeSet = [];
    const {readOperands, writeOperands} = getRegisterOperands(instruction);
    
    readOperands.forEach(operand => {
        if (instruction[operand]) {
            readSet.push(instruction[operand]);
        }
    });
    
    writeOperands.forEach(operand => {
        if (instruction[operand]) {
            writeSet.push(instruction[operand]);
        }
    });

    return { 
        readSet: new Set(readSet), 
        writeSet: new Set(writeSet) 
    };
}

/**
 * Gets the read and write operands for an instruction
 * @param {Object} instruction - Instruction to analyze
 * @returns {Object} Object containing readOperands and writeOperands
 */
function getRegisterOperands(instruction) {
    const readOperands = new Set();
    const writeOperands = new Set();

    switch(instruction.type) {
        case 'ADD':
        case 'SUB':
        case 'MUL':
        case 'DIV':
            if (instruction.rs1) readOperands.add('rs1');
            if (instruction.rs2) readOperands.add('rs2');
            if (instruction.rd) writeOperands.add('rd');
            break;
        case 'LOAD':
            if (instruction.rs1) readOperands.add('rs1');  // Base register
            if (instruction.rd) writeOperands.add('rd');
            break;
        case 'STORE':
            if (instruction.rs1) readOperands.add('rs1');  // Base register
            if (instruction.rs2) readOperands.add('rs2');  // Value to store
            break;
    }
    return {readOperands, writeOperands};
}

/**
 * Validates that read and write register sets are valid and don't overlap
 * @param {Object} instruction - Instruction to validate
 * @returns {Object} Validation result with boolean valid flag and optional error message
 */
function validateRegisterSets(instruction) {
    // Check if instruction type is valid
    if (!INSTRUCTION_TYPES.includes(instruction.type)) {
        return {
            valid: false,
            error: 'Invalid instruction type'
        };
    }

    const { readSet, writeSet } = getRegisterSets(instruction);
    
    // Check for required registers based on instruction type
    if (instruction.type !== 'STORE' && !instruction.rd) {
        return {
            valid: false,
            error: `${instruction.type} requires destination register (rd)`
        };
    }
    
    if (!instruction.rs1) {
        return {
            valid: false,
            error: 'Source register 1 (rs1) is required'
        };
    }
    
    if (instruction.type !== 'LOAD' && !instruction.rs2) {
        return {
            valid: false,
            error: `${instruction.type} requires source register 2 (rs2)`
        };
    }

    // Check for register name validity
    const allRegs = [...readSet, ...writeSet];
    for (const reg of allRegs) {
        if (!isValidRegister(reg)) {
            return {
                valid: false,
                error: `Invalid register format: ${reg}. Must be R0-R${MAX_REGISTERS - 1}.`
            };
        }
    }

    // Check for overlap between read and write sets
    const overlap = [...readSet].filter(reg => writeSet.has(reg));
    if (overlap.length > 0) {
        return {
            valid: false,
            error: `Register ${overlap[0]} cannot be both input and output`
        };
    }

    // For STORE instructions, check if it's trying to write to registers
    if (instruction.type === 'STORE' && writeSet.size > 0) {
        return {
            valid: false,
            error: 'STORE instruction cannot write to registers'
        };
    }

    return { valid: true };
}

export {
    isValidRegister,
    getRegisterSets,
    getRegisterOperands,
    validateRegisterSets
};
