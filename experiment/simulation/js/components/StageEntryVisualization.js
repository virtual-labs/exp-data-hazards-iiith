// js/components/StageEntryVisualization.js
import { PIPELINE_STAGES, formatInstruction } from '../utils/types.js';

class StageEntryVisualization {
    constructor(container) {
        this.container = container;
    }

    getStageEntryCycle(stages, stageName) {
        const stageEntry = stages.find(s => s.stage === stageName);
        return stageEntry ? stageEntry.cycle.toString() : '-';
    }

    getHazardRemarks(stages) {
        const hazards = stages
            .filter(s => s.stage === 'Stall' && s.hazard)
            .map(s => s.hazard);
        
        if (hazards.length === 0) {
            return 'None';
        }

        console.log(hazards)

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

        console.log(uniqueHazards)
        return `<ul class="list-disc pl-4 space-y-1">
            ${Array.from(uniqueHazards.values()).map(hazard => {
                let description = '';
                if (hazard.type === 'RAW') {
                    description = `RAW hazard: Waiting for ${hazard.reg} from instruction ${hazard.producerIndex + 1} (${hazard.stallCycles} cycles)`;
                } else if (hazard.type === 'Structural') {
                    description = `Structural hazard: Waiting for instruction ${hazard.producerIndex + 1} to advance (${hazard.stallCycles} cycles)`;
                } else {
                    description = `${hazard.type} hazard (${hazard.stallCycles} cycles)`;
                }
                return `<li class="text-sm">${description}</li>`;
            }).join('')}
        </ul>`;
    }

    render(timeline) {
        this.container.innerHTML = `
            <div class="card mb-4 overflow-x-auto">
                <div class="p-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                        Stage Entry Cycles
                        <svg class="w-5 h-5 text-gray-500" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                    </h2>
                    <table class="min-w-full border-collapse">
                        <thead>
                            <tr>
                                <th class="border p-2 bg-gray-50">Instruction</th>
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
                                    <td class="border p-2 font-mono whitespace-nowrap">
                                        ${idx + 1}. ${formatInstruction(item.instruction)}
                                    </td>
                                    ${PIPELINE_STAGES.map(stage => `
                                        <td class="border p-2 text-center">
                                            ${this.getStageEntryCycle(item.stages, stage)}
                                        </td>
                                    `).join('')}
                                    <td class="border p-2">
                                        ${this.getHazardRemarks(item.stages)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}

export default StageEntryVisualization;