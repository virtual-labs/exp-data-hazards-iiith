// js/components/StageEntryVisualization.js
import { PIPELINE_STAGES, formatInstruction } from '../utils/types.js';
import { UI_COLORS, CSS_CLASSES } from '../utils/uiConstants.js';

class StageEntryVisualization {
    constructor(container) {
        this.container = container;
    }

    getStageEntryCycle(stages, stageName) {
        const stageEntry = stages.find(s => s.stage === stageName);
        return stageEntry ? stageEntry.cycle.toString() : '-';
    }

    getHazardRemarks(stages, forwardingPaths) {
        const hazards = stages
            .filter(s => s.stage === 'Stall' && s.hazard)
            .map(s => s.hazard);
        
        if (hazards.length === 0 && (!forwardingPaths || forwardingPaths.length === 0)) {
            return 'None';
        }

        let remarks = '';

        // Add hazard information
        if (hazards.length > 0) {
            // Create a Map to track unique hazards and their total stall cycles
            const uniqueHazards = new Map();
            
            hazards.forEach(hazard => {
                const key = JSON.stringify({
                    type: hazard.type,
                    reg: hazard.reg,
                    producerIndex: hazard.producerIndex
                });
                
                if (!uniqueHazards.has(key)) {
                    uniqueHazards.set(key, { ...hazard });
                }
            });

            remarks += `<div class="text-sm font-medium ${UI_COLORS.HAZARD_HEADING} mt-1">Hazards:</div>`;

            remarks += `<ul class="list-disc pl-4 space-y-1">
                ${Array.from(uniqueHazards.values()).map(hazard => {
                    let description = '';
                    if (hazard.type === 'RAW') {
                        description = `RAW hazard: Waiting for ${hazard.reg} from instruction ${hazard.producerIndex + 1} (${hazard.stallCycles} cycles)`;
                        if (hazard.forwarded) {
                            description += ` <span class="${UI_COLORS.FORWARDING}">(reduced by forwarding)</span>`;
                        }
                    } else if (hazard.type === 'Structural') {
                        description = `Structural hazard: Waiting for instruction ${hazard.producerIndex + 1} to advance (${hazard.stallCycles} cycles)`;
                    } else {
                        description = `${hazard.type} hazard (${hazard.stallCycles} cycles)`;
                    }
                    return `<li class="text-sm">${description}</li>`;
                }).join('')}
            </ul>`;
        }

        // Add forwarding information - group by register to avoid duplicates
        if (forwardingPaths && forwardingPaths.length > 0) {
            remarks += `${hazards.length > 0 ? '<div class="mt-2"></div>' : ''}
            <div class="text-sm font-medium ${UI_COLORS.FORWARDING} mt-1">Data Forwarding:</div>
            <ul class="list-disc pl-4 space-y-1">`;
            
            // Group forwarding paths by register
            const forwardingByReg = {};
            forwardingPaths.forEach(path => {
                if (!forwardingByReg[path.register]) {
                    forwardingByReg[path.register] = path;
                }
            });
            
            // Create list items for each unique register forwarding
            Object.values(forwardingByReg).forEach(path => {
                remarks += `<li class="text-sm">
                    ${path.register} from instruction ${path.from + 1} (${path.fromStage}) to ${path.toStage} in cycle ${path.cycle}
                </li>`;
            });
            
            remarks += `</ul>`;
        }

        return remarks;
    }

    render(timeline, forwardingEnabled = false) {
        if (!timeline || timeline.length === 0) {
            this.container.innerHTML = `
                <div class="${CSS_CLASSES.CARD}">
                    <div class="${CSS_CLASSES.CARD_CONTENT}">
                        <p class="text-gray-500">No instructions to display. Add instructions to see the stage entry visualization.</p>
                    </div>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="${CSS_CLASSES.CARD}">
                <div class="${CSS_CLASSES.CARD_CONTENT}">
                    <h2 class="${CSS_CLASSES.TITLE}">
                        Stage Entry Cycles
                        ${forwardingEnabled ? 
                            `<span class="${CSS_CLASSES.BADGE.FORWARDING}">Forwarding Enabled</span>` : ''}
                    </h2>
                    <div class="table-container">
                        <table class="min-w-full border-collapse">
                            <thead>
                                <tr>
                                    <th class="border p-2 bg-gray-50 sticky-column min-w-[180px]">Instruction</th>
                                    ${PIPELINE_STAGES.map(stage => `
                                        <th class="border p-2 bg-gray-50 min-w-[100px]">
                                            ${stage}
                                        </th>
                                    `).join('')}
                                    <th class="border p-2 bg-gray-50 min-w-[300px]">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${timeline.map((item, idx) => `
                                    <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                        <td class="border p-2 font-mono whitespace-nowrap sticky-column ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                            ${idx + 1}. ${formatInstruction(item.instruction)}
                                        </td>
                                        ${PIPELINE_STAGES.map(stage => `
                                            <td class="border p-2 text-center">
                                                ${this.getStageEntryCycle(item.stages, stage)}
                                            </td>
                                        `).join('')}
                                        <td class="border p-2">
                                            ${this.getHazardRemarks(item.stages, forwardingEnabled ? item.forwardingPaths : [])}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
}

export default StageEntryVisualization;