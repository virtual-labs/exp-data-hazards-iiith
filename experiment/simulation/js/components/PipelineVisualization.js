// js/components/PipelineVisualization.js
import { formatInstruction } from '../utils/types.js';

class PipelineVisualization {
    constructor(container) {
        this.container = container;
    }

    getHazardStyle(type) {
        const styles = {
            'RAW': 'bg-red-100 text-red-800',
            'WAW': 'bg-yellow-100 text-yellow-800',
            'Structural': 'bg-purple-100 text-purple-800'
        };
        return styles[type] || 'bg-orange-100 text-orange-800';
    }

    createStageCell(stage, hazard) {
        if (!stage) {
            return '<td class="border p-2"></td>';
        }

        let bgColor = stage === 'Fetch' ? 'bg-blue-100' :
                      stage === 'Decode' ? 'bg-green-100' :
                      stage === 'Execute' ? 'bg-yellow-100' :
                      stage === 'Memory' ? 'bg-pink-100' :
                      stage === 'Writeback' ? 'bg-purple-100' : 'bg-gray-100';

        if (stage === 'Stall') {
            bgColor = {
                'RAW': 'bg-red-100',
                'WAW': 'bg-yellow-100',
                'Structural': 'bg-purple-100'
            }[hazard?.type] || 'bg-gray-100';
        }

        const tooltip = hazard ? `
            <div class="tooltip hidden group-hover:block absolute z-10 -top-full left-1/2 -translate-x-1/2 
                        p-2 bg-white shadow-lg rounded border text-xs">
                <div class="font-bold">${hazard.type} Hazard</div>
                <div class="text-gray-600">
                    ${hazard.type === 'RAW' ? 
                        `Waiting for ${hazard.reg}<br>from Instruction ${hazard.producerIndex + 1}` :
                        hazard.type === 'Structural' ? 
                            `Waiting for Instruction ${hazard.producerIndex + 1} to advance` :
                            'Pipeline Hazard'
                    }
                </div>
            </div>
        ` : '';

        return `
            <td class="border p-2 text-center ${bgColor} relative group">
                <div class="flex items-center justify-center gap-1">
                    ${stage}
                    ${hazard ? '<svg class="w-4 h-4 text-red-500" viewBox="0 0 24 24"><path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>' : ''}
                </div>
                ${tooltip}
            </td>
        `;
    }

    render(timeline) {
        if (timeline.length === 0) return;

        // Find the maximum cycle
        const maxCycle = Math.max(
            ...timeline.flatMap(t => t.stages.map(s => s.cycle))
        );

        this.container.innerHTML = `
            <div class="card mb-4 overflow-x-auto">
                <div class="p-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                        Pipeline Execution
                        <div class="text-sm font-normal text-gray-500">
                            (hover over hazards for details)
                        </div>
                    </h2>
                    <table class="min-w-full border-collapse">
                        <thead>
                            <tr>
                                <th class="border p-2 bg-gray-50">Instruction</th>
                                ${Array.from({ length: maxCycle }, (_, i) => `
                                    <th class="border p-2 bg-gray-50 min-w-[60px]">
                                        Cycle ${i + 1}
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${timeline.map(item => `
                                <tr>
                                    <td class="border p-2 font-mono whitespace-nowrap">
                                        ${item.index + 1}. ${formatInstruction(item.instruction)}
                                    </td>
                                    ${Array.from({ length: maxCycle }, (_, cycle) => {
                                        const stageInfo = item.stages.find(s => s.cycle === cycle + 1);
                                        return this.createStageCell(
                                            stageInfo?.stage,
                                            stageInfo?.hazard
                                        );
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }  
}

export default PipelineVisualization;
