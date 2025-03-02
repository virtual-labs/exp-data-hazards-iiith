// js/utils/instructionConfig.js
import { PIPELINE_STAGES, STAGE_AVAILABILITY } from './types.js';

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
        if (['LOAD', 'STORE'].includes(instrType)) {
            multicycle.Execute = 1;
            multicycle.Memory = cycles.memory;
        } else {
            // For compute instructions, apply latency to execute stage
            multicycle.Execute = cycles.execute;
            multicycle.Memory = 1;
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

export {
    generateStageDefinitions,
    getReadStage,
    getWriteStage
};
