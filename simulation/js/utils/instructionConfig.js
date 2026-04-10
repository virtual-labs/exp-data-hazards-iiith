// js/utils/instructionConfig.js
import { 
    PIPELINE_STAGES, 
    STAGE_AVAILABILITY, 
    FORWARDING_CONFIG,
    MEMORY_INSTRUCTIONS,
    REGISTER_FILE_TIMING
} from './types.js';

/**
 * Generates stage definitions based on current latency configuration
 * @param {Object} latencies - Object containing latency configurations for each instruction
 * @returns {Object} Stage definitions for pipeline simulation
 */
function generateStageDefinitions(latencies) {
    const definitions = {};
    
    // For each instruction type
    Object.entries(latencies).forEach(([instrType, cycles]) => {
        // Initialize stage array and multicycle object
        const stages = [...PIPELINE_STAGES];
        const multicycle = {};
        
        // For memory instructions (LOAD/STORE), apply latency to memory stage
        if (MEMORY_INSTRUCTIONS.includes(instrType)) {
            multicycle[PIPELINE_STAGES[2]] = 1; // Execute
            multicycle[PIPELINE_STAGES[3]] = cycles.memory; // Memory
        } else {
            // For compute instructions, apply latency to execute stage
            multicycle[PIPELINE_STAGES[2]] = cycles.execute; // Execute
            multicycle[PIPELINE_STAGES[3]] = 1; // Memory
        }
        
        definitions[instrType] = {
            stages,
            multicycle
        };
    });
    
    return definitions;
}

/**
 * Helper function to get the required stage for reading an instruction's operands
 * @param {string} instrType - Type of instruction
 * @returns {string} The stage where operands must be available
 */
function getReadStage(instrType) {
    return STAGE_AVAILABILITY.READ[instrType];
}

/**
 * Helper function to get the stage where an instruction writes its result
 * @param {string} instrType - Type of instruction
 * @returns {string} The stage where the result becomes available
 */
function getWriteStage(instrType) {
    return STAGE_AVAILABILITY.WRITE[instrType];
}

/**
 * Determines when a result is available with forwarding enabled
 * @param {string} instrType - Type of the producing instruction
 * @param {Object} stageTimings - Timing information for the instruction stages
 * @param {boolean} forwardingEnabled - Whether forwarding is enabled
 * @returns {number} The cycle when the result is available
 */
function getResultAvailableCycle(instrType, stageTimings, forwardingEnabled) {
    if (forwardingEnabled) {
        // With forwarding, results are available at the end of the configured stage
        const forwardingStage = STAGE_AVAILABILITY.FORWARDING_RESULT_AVAILABLE[instrType];
        return stageTimings[forwardingStage]?.end || 0;
    } else {
        // Without forwarding, results are only available on writeback
        return stageTimings[getWriteStage(instrType)].end;
    }
}

/**
 * Determines when a specific operand for an instruction needs to be available
 * @param {string} instrType - Type of the consuming instruction
 * @param {string} operand - The operand register (e.g., 'rs1', 'rs2')
 * @returns {string} The pipeline stage when the operand is needed
 */
function getOperandNeededStage(instrType, operand, forwardingEnabled) {
    if (forwardingEnabled) {
        // Check if there's a special case for this instruction type and operand
        if (FORWARDING_CONFIG.OPERAND_NEEDED_STAGE[instrType] && 
            FORWARDING_CONFIG.OPERAND_NEEDED_STAGE[instrType][operand]) {
            return FORWARDING_CONFIG.OPERAND_NEEDED_STAGE[instrType][operand];
        }
        
        // Default case - operands are needed at the execute stage
        return FORWARDING_CONFIG.DEFAULT_OPERAND_NEEDED_STAGE;
    }
    else {
        return getReadStage(instrType);
    }
}

/**
 * Determines if a value can be read in the same cycle it's written
 * due to register file read/write timing
 * @returns {boolean} Whether same-cycle read after write is possible
 */
function canReadAfterWriteInSameCycle() {
    return REGISTER_FILE_TIMING.WRITE_BEFORE_READ_SAME_CYCLE;
}

export {
    generateStageDefinitions,
    getReadStage,
    getWriteStage,
    getResultAvailableCycle,
    getOperandNeededStage,
    canReadAfterWriteInSameCycle
};