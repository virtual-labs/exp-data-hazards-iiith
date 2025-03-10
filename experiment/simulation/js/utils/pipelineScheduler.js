// js/utils/pipelineScheduler.js
import { 
    generateStageDefinitions, 
    getReadStage, 
    getWriteStage,
    getResultAvailableCycle,
    getOperandNeededStage,
    canReadAfterWriteInSameCycle
} from './instructionConfig.js';
import { 
    getRegisterSets,
    getRegisterOperands
} from './registerSets.js';
import { 
    PIPELINE_STAGES, 
    STAGE_AVAILABILITY,
    FORWARDING_CONFIG,
    REGISTER_FILE_TIMING
} from './types.js';

/**
 * Determines the hazardous registers to be checked this stage (if any)
 * @param {Object} instruction - The instruction object
 * @param {string} stage - The current pipeline stage
 * @param {boolean} forwardingEnabled - Whether forwarding is enabled
 * @returns {Set} Regs to be checked
 */
function getHazardousRegs(instruction, stage, forwardingEnabled) {
    const { readOperands } = getRegisterOperands(instruction);
    let checkRegs = new Set();
    readOperands.forEach(operand => {
        if (getOperandNeededStage(instruction.type, operand, forwardingEnabled) == stage)
            checkRegs.add(instruction[operand]);
    });
    return checkRegs;
}

/**
 * Determines the stage a particular cycle falls within for an instruction
 * @param {Object} stageTimings - Timing information for all stages
 * @param {Number} cycle - The cycle to check
 * @returns {String} The pipeline stage name or 0 if not found
 */
function cycleToStage(stageTimings, cycle) {
    for (const stage of PIPELINE_STAGES) if (stageTimings[stage].start <= cycle && cycle <= stageTimings[stage].end) return stage;
    return 0; //Should never happen
}

/**
 * Simulates the pipeline execution for a given set of instructions
 * @param {Array} instructions - Array of instruction objects
 * @param {Object} latencies - Object containing latency configurations
 * @param {Boolean} forwardingEnabled - Whether data forwarding is enabled
 * @returns {Object} Object containing timeline, hazards, and forwarding paths
 */
function simulatePipeline(instructions, latencies, forwardingEnabled = false) {
    // Generate stage definitions based on current latencies
    const STAGE_DEFINITIONS = generateStageDefinitions(latencies);
    const timeline = [];
    const hazards = [];
    
    // Track forwarding paths for visualization
    const forwardingPaths = [];

    for (let i = 0; i < instructions.length; i++) {
        const currentInstruction = instructions[i];
        const stageTimings = {};
        let currentCycle = 1;

        if (i > 0) {
            // Start fetch when previous instruction finishes fetch
            const prevInstr = timeline[i - 1];
            currentCycle = prevInstr.stageTimings[PIPELINE_STAGES[0]].end + 1;
        }

        // For each stage, determine start and end cycles
        for (let stageIdx = 0; stageIdx < PIPELINE_STAGES.length; stageIdx++) {
            const stage = PIPELINE_STAGES[stageIdx];
            const currHazards = [];
            let startCycle = currentCycle;
            let stallCycles = 0;
            let hazardInfo = null;

            if (i > 0) {
                const prevInstr = timeline[i - 1];
                
                // Check structural hazard with previous instruction
                if (stageIdx + 1 < PIPELINE_STAGES.length) {
                    const nextStage = PIPELINE_STAGES[stageIdx + 1];
                    const prevInstrStageStart = prevInstr.stageTimings[nextStage]?.start;
                    
                    if (prevInstrStageStart && startCycle < prevInstrStageStart) {
                        stallCycles = prevInstrStageStart - startCycle;
                        startCycle = prevInstrStageStart;
                        hazardInfo = {
                            type: 'Structural',
                            producerIndex: i - 1,
                            consumerIndex: i,
                            stallCycles: stallCycles
                        };
                        hazards.push(hazardInfo);
                        currHazards.push(hazardInfo);
                        hazardInfo = null;
                    }
                }
            }

            const checkRegs = getHazardousRegs(currentInstruction, stage, forwardingEnabled);
            for (const reg of checkRegs) {
                for (let j = i - 1; j >= 0; j--) {
                    const prevInstr = timeline[j];
                    if (prevInstr.stageTimings[PIPELINE_STAGES.at(-1)].end < startCycle) break; // We dont care about instructions which have finished
                    const { writeSet } = getRegisterSets(prevInstr.instruction);
                    if (writeSet.has(reg)) {
                        let resultAvailableCycle = getResultAvailableCycle(prevInstr.instruction.type, prevInstr.stageTimings, forwardingEnabled);
                        if (cycleToStage(prevInstr.stageTimings, resultAvailableCycle) == PIPELINE_STAGES.at(-1) && canReadAfterWriteInSameCycle()) resultAvailableCycle--;

                        if (resultAvailableCycle >= startCycle) {
                            let rawStallCycles = resultAvailableCycle - startCycle + 1;
                            startCycle = resultAvailableCycle + 1;
                            
                            hazardInfo = {
                                type: 'RAW',
                                reg: reg,
                                producerIndex: j,
                                consumerIndex: i,
                                stallCycles: rawStallCycles
                            };
                            
                            stallCycles += rawStallCycles;
                        }

                        if (forwardingEnabled) {
                            let forwardingFromStage = cycleToStage(prevInstr.stageTimings, startCycle - 1);
                            forwardingPaths.push({
                                from: j, 
                                to: i, 
                                register: reg,
                                fromStage: forwardingFromStage,
                                toStage: stage,
                                cycle: startCycle
                            });
                        }
                        break;
                    }
                }
            }

            // Get stage duration based on instruction type and current latencies
            const stageConfig = STAGE_DEFINITIONS[currentInstruction.type];
            const stageDuration = stageConfig.multicycle[stage] || 1;

            if (hazardInfo) {
                hazards.push(hazardInfo);
                currHazards.push(hazardInfo);
            }
            
            // Record stage timing and any stalls
            stageTimings[stage] = {
                start: startCycle,
                end: startCycle + stageDuration - 1,
                stallsBefore: stallCycles,
                hazards: currHazards
            };

            currentCycle = stageTimings[stage].end + 1;
        }

        timeline.push({
            instruction: currentInstruction,
            stageTimings,
            index: i,
            forwardingPaths: forwardingEnabled ? 
                forwardingPaths.filter(path => path.to === i) : []
        });
    }

    return { 
        timeline, 
        hazards,
        forwardingPaths: forwardingEnabled ? forwardingPaths : []
    };
}

/**
 * Generates a visualization-friendly representation of the pipeline execution
 * @param {Array} timeline - The pipeline execution timeline
 * @returns {Array} A visualization-friendly pipeline timeline
 */
function generatePipelineVisualization(timeline) {
    const result = [];
    
    // Find max cycle across all instructions
    const maxCycle = Math.max(...timeline.flatMap(entry => 
        Object.values(entry.stageTimings).map(s => s.end)
    ));

    for (const entry of timeline) {
        const cycleStages = [];

        // For each cycle, determine what's happening
        let currentCycle = Math.min(...Object.values(entry.stageTimings).map(timing => timing.start));

        // Handle stalls first
        for (const [stageName, timing] of Object.entries(entry.stageTimings)) {
            if (stageName === PIPELINE_STAGES[0] && timing.stallsBefore > 0) { // Fetch
                currentCycle -= timing.stallsBefore;
            }
            
            for (const hazard of timing.hazards) {
                for (let stalls = 0; stalls < hazard.stallCycles; stalls++) {
                    cycleStages.push({
                        cycle: currentCycle + stalls,
                        stage: 'Stall',
                        hazard: hazard
                    });
                }
                currentCycle += hazard.stallCycles;
            }
            
            // Then handle actual stage execution
            for (let cycles = 0; cycles < (timing.end - timing.start + 1); cycles++) {
                cycleStages.push({
                    cycle: currentCycle + cycles,
                    stage: stageName,
                    hazard: null
                });
            }
            currentCycle += timing.end - timing.start + 1;
        }

        result.push({
            instruction: entry.instruction,
            stages: cycleStages,
            index: entry.index,
            forwardingPaths: entry.forwardingPaths || []
        });
    }

    return result;
}

export {
    simulatePipeline,
    generatePipelineVisualization
};