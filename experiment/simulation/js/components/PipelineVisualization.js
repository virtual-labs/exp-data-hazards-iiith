// js/components/PipelineVisualization.js
import { formatInstruction, PIPELINE_STAGES } from '../utils/types.js';
import { UI_COLORS, UI_ICONS, CSS_CLASSES } from '../utils/uiConstants.js';

class PipelineVisualization {
    constructor(container) {
        this.container = container;
    }

    getHazardStyle(type) {
        return UI_COLORS.HAZARDS[type] || 'bg-orange-100 text-orange-800';
    }

    createStageCell(stage, hazard, forwarding = null) {
        if (!stage) {
            return '<td class="border p-2"></td>';
        }

        // Get background color based on stage
        let bgColor = UI_COLORS.PIPELINE_STAGES[stage];

        // For stalls, get color based on hazard type
        if (stage === 'Stall' && hazard) {
            bgColor = UI_COLORS.HAZARDS[hazard.type]?.split(' ')[0] || UI_COLORS.PIPELINE_STAGES.Stall;
        }

        // If there's forwarding, add an indicator
        let forwardingIndicator = '';
        let forwardingTooltip = '';
        
        if (forwarding?.length) {
            forwardingIndicator = UI_ICONS.FORWARDING;

            forwardingTooltip = forwarding.map(path => `
                <div class="font-bold">Forwarding ${path.register}</div>
                <div>From: Instruction ${path.from + 1} (${path.fromStage})</div>
                <div>To: Instruction ${path.to + 1} (${stage})</div>
                `).join('');
        }

        const tooltip = hazard ? `
            <div class="${CSS_CLASSES.TOOLTIP}">
                <div class="font-bold">${hazard.type} Hazard</div>
                <div class="text-gray-600">
                    ${hazard.type === 'RAW' ? 
                        `Waiting for ${hazard.reg}<br>from Instruction ${hazard.producerIndex + 1}` :
                        hazard.type === 'Structural' ? 
                            `Waiting for Instruction ${hazard.producerIndex + 1} to advance` :
                            'Pipeline Hazard'
                    }
                    ${hazard.forwarded ? `<br><span class="${UI_COLORS.FORWARDING}">Reduced by forwarding</span>` : ''}
                </div>
            </div>
        ` : forwarding ? `
            <div class="${CSS_CLASSES.TOOLTIP}">
                ${forwardingTooltip}
            </div>
        ` : '';

        return `
            <td class="border p-2 text-center ${bgColor} relative group">
                <div class="flex items-center justify-center gap-1">
                    ${stage}
                    ${hazard ? UI_ICONS.HAZARD : ''}
                    ${forwardingIndicator}
                </div>
                ${tooltip}
            </td>
        `;
    }

    findForwardingForCycle(timeline, instrIndex, cycle, stage) {
        // Skip if no forwarding paths
        if (!timeline[instrIndex]?.forwardingPaths?.length) {
            return null;
        }
        
        // Find forwarding path where this instruction is receiving data at this cycle
        const forwardingPaths = timeline[instrIndex].forwardingPaths;
        let paths = []
        for (const path of forwardingPaths) {
            if (path.cycle === cycle && path.toStage === stage) {
                paths.push(path);
            }
        }
        
        return paths;
    }

    render(timeline, forwardingEnabled = false) {
        if (!timeline || timeline.length === 0) {
            this.container.innerHTML = `
                <div class="${CSS_CLASSES.CARD}">
                    <div class="${CSS_CLASSES.CARD_CONTENT}">
                        <p class="text-gray-500">No instructions to display. Add instructions to see the pipeline visualization.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Find the maximum cycle
        const maxCycle = Math.max(
            ...timeline.flatMap(t => t.stages.map(s => s.cycle))
        );

        this.container.innerHTML = `
            <div class="${CSS_CLASSES.CARD}">
                <div class="${CSS_CLASSES.CARD_CONTENT}">
                    <h2 class="${CSS_CLASSES.TITLE}">
                        Pipeline Execution
                        <div class="text-sm font-normal text-gray-500">
                            (hover over ${forwardingEnabled ? 'hazards and forwarding paths' : 'hazards'} for details)
                        </div>
                        ${forwardingEnabled ? `<span class="${CSS_CLASSES.BADGE.FORWARDING}">Forwarding Enabled</span>` : ''}
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
                                        
                                        // If forwarding is enabled, check for forwarding at this cycle
                                        let forwarding = null;
                                        if (forwardingEnabled && stageInfo && stageInfo.stage !== 'Stall') {
                                            forwarding = this.findForwardingForCycle(
                                                timeline, 
                                                item.index, 
                                                cycle + 1,
                                                stageInfo.stage
                                            );
                                        }
                                        
                                        return this.createStageCell(
                                            stageInfo?.stage,
                                            stageInfo?.hazard,
                                            forwarding
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