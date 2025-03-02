// js/utils/pipelineScheduler.js
import { generateStageDefinitions, getReadStage } from './instructionConfig.js';
import { getRegisterSets } from './registerSets.js';

const STAGES = ['Fetch', 'Decode', 'Execute', 'Memory', 'Writeback'];

function simulatePipeline(instructions, latencies) {
    // Generate stage definitions based on current latencies
    const STAGE_DEFINITIONS = generateStageDefinitions(latencies);
    const timeline = [];
    const hazards = [];

    for (let i = 0; i < instructions.length; i++) {
        const currentInstr = instructions[i];
        const stageTimings = {};
        let currentCycle = 1;

        if (i > 0) {
            // Start fetch when previous instruction finishes fetch
            const prevInstr = timeline[i - 1];
            currentCycle = prevInstr.stageTimings.Fetch.end + 1;
        }

        // For each stage, determine start and end cycles
        for (let stageIdx = 0; stageIdx < STAGES.length; stageIdx++) {
            const currHazards = [];
            const stage = STAGES[stageIdx];
            let startCycle = currentCycle;
            let stallCycles = 0;
            let hazardInfo = null;

            if (i > 0) {
                const prevInstr = timeline[i - 1];
                
                // Check structural hazard with previous instruction
                if (stageIdx + 1 < STAGES.length) {
                    const nextStage = STAGES[stageIdx + 1];
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

            // For Execute stage, check RAW hazards
            if (stage === getReadStage(currentInstr.type)) {
                const { readSet } = getRegisterSets(currentInstr);
                
                // Look back at previous instructions that write registers we need
                for (let j = i - 1; j >= 0; j--) {
                    const prevInstr = timeline[j];
                    const { writeSet } = getRegisterSets(prevInstr.instruction);
                    
                    for (const reg of readSet) {
                        if (writeSet.has(reg)) {
                            const writebackComplete = prevInstr.stageTimings.Writeback.end + 1;
                            
                            if (writebackComplete > startCycle) {
                                const rawStallCycles = writebackComplete - startCycle;
                                startCycle = writebackComplete;
                                hazardInfo = {
                                    type: 'RAW',
                                    reg: reg,
                                    producerIndex: j,
                                    consumerIndex: i,
                                    stallCycles: rawStallCycles
                                };
                                stallCycles += rawStallCycles;
                            }
                            break; // Only care about most recent write
                        }
                    }
                    if (hazardInfo) break;
                }
            }

            // Get stage duration based on instruction type and current latencies
            const stageConfig = STAGE_DEFINITIONS[currentInstr.type];
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
            instruction: currentInstr,
            stageTimings,
            index: i
        });
    }

    return { timeline, hazards };
}

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
            if (stageName === 'Fetch' && timing.stallsBefore > 0) {
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
            index: entry.index
        });
    }

    return result;
}

export {
    simulatePipeline,
    generatePipelineVisualization
};
