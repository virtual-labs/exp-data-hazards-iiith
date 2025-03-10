// js/components/PerformanceMetrics.js
import { PIPELINE_STAGES, HAZARD_TYPES } from '../utils/types.js';
import { UI_COLORS, CSS_CLASSES } from '../utils/uiConstants.js';

class PerformanceMetrics {
    constructor(container) {
        this.container = container;
    }

    calculateMetrics(timeline, hazards, forwardingEnabled) {
        // Calculate total cycles
        const maxCycle = Math.max(
            ...timeline.flatMap(t => t.stages.map(s => s.cycle))
        );
        
        // Calculate total instructions
        const totalInstructions = timeline.length;
        
        // Calculate CPI
        const cpi = totalInstructions > 0 ? maxCycle / totalInstructions : 0;
        
        // Calculate stall cycles by hazard type
        const stallsByType = hazards.reduce((acc, hazard) => {
            acc[hazard.type] = (acc[hazard.type] || 0) + hazard.stallCycles;
            return acc;
        }, {});
        
        const totalStalls = Object.values(stallsByType).reduce((a, b) => a + b, 0);

        // Calculate ideal cycles - in a perfect pipeline:
        // First instruction takes PIPELINE_STAGES.length cycles
        // Each subsequent instruction takes 1 cycle
        const idealCycles = totalInstructions > 0 ? 
            PIPELINE_STAGES.length + (totalInstructions - 1) : 0;
            
        const stallPercentage = maxCycle > 0 ? 
            (totalStalls / maxCycle) * 100 : 0;

        // Count forwarded data paths
        const forwardingPaths = timeline.flatMap(t => t.forwardingPaths || []);
        const forwardingCount = forwardingPaths.length;

        return {
            maxCycle,
            totalInstructions,
            cpi,
            stallsByType,
            totalStalls,
            idealCycles,
            stallPercentage,
            forwardingCount,
            forwardingEnabled
        };
    }

    render(
        timeline, 
        hazards, 
        forwardingEnabled = false, 
        timelineWithoutForwarding = null, 
        hazardsWithoutForwarding = null
    ) {
        // Calculate metrics for current simulation
        const metrics = this.calculateMetrics(timeline, hazards, forwardingEnabled);
        
        // Calculate comparison metrics if needed
        let comparison = null;
        
        if (forwardingEnabled && timelineWithoutForwarding && hazardsWithoutForwarding) {
            // Calculate metrics for the non-forwarding simulation
            const metricsWithoutForwarding = this.calculateMetrics(
                timelineWithoutForwarding, 
                hazardsWithoutForwarding, 
                false
            );
            
            // Calculate differences
            const cycleReduction = metricsWithoutForwarding.maxCycle - metrics.maxCycle;
            const percentReduction = metricsWithoutForwarding.maxCycle > 0 ?
                (cycleReduction / metricsWithoutForwarding.maxCycle) * 100 : 0;
            
            comparison = {
                cycleReduction,
                percentReduction,
                cpiReduction: metricsWithoutForwarding.cpi - metrics.cpi,
                stallReduction: metricsWithoutForwarding.totalStalls - metrics.totalStalls,
                withoutForwardingCycles: metricsWithoutForwarding.maxCycle
            };
        }

        this.container.innerHTML = `
            <div class="${CSS_CLASSES.CARD}">
                <div class="${CSS_CLASSES.CARD_CONTENT}">
                    <h2 class="${CSS_CLASSES.TITLE}">
                        Performance Metrics
                        ${forwardingEnabled ? 
                            `<span class="${CSS_CLASSES.BADGE.FORWARDING}">Forwarding Enabled</span>` : ''}
                    </h2>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-500">Total Cycles</div>
                            <div class="text-2xl font-bold">${metrics.maxCycle}</div>
                            <div class="text-xs text-gray-500">
                                Ideal: ${metrics.idealCycles}
                                ${comparison && comparison.cycleReduction > 0 ? 
                                    `<span class="text-green-600 ml-1">↓${comparison.cycleReduction} vs. ${comparison.withoutForwardingCycles} (${comparison.percentReduction.toFixed(1)}%)</span>` : ''}
                            </div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-500">Instructions</div>
                            <div class="text-2xl font-bold">${metrics.totalInstructions}</div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-500">CPI</div>
                            <div class="text-2xl font-bold">${metrics.cpi.toFixed(2)}</div>
                            <div class="text-xs text-gray-500">
                                Ideal: 1.00
                                ${comparison && comparison.cpiReduction > 0 ? 
                                    `<span class="text-green-600 ml-1">↓${comparison.cpiReduction.toFixed(2)}</span>` : ''}
                            </div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-500">Total Stalls</div>
                            <div class="text-2xl font-bold">${metrics.totalStalls}</div>
                            <div class="text-xs text-gray-500">
                                ${metrics.stallPercentage.toFixed(1)}% of cycles
                                ${comparison && comparison.stallReduction > 0 ? 
                                    `<span class="text-green-600 ml-1">↓${comparison.stallReduction}</span>` : ''}
                            </div>
                        </div>
                        ${forwardingEnabled ? `
                            <div class="p-4 bg-gray-50 rounded-lg">
                                <div class="text-sm text-gray-500">Forwarding Paths</div>
                                <div class="text-2xl font-bold">${metrics.forwardingCount}</div>
                                <div class="text-xs text-gray-500">Data values forwarded</div>
                            </div>
                        ` : ''}
                        ${Object.keys(metrics.stallsByType).length > 0 ? `
                            <div class="p-4 bg-gray-50 rounded-lg ${forwardingEnabled ? 'col-span-1' : 'col-span-2'}">
                                <div class="text-sm text-gray-500">Stalls by Type</div>
                                <div class="mt-2 space-y-1">
                                    ${HAZARD_TYPES.map(type => 
                                        metrics.stallsByType[type] ? `
                                            <div class="flex justify-between items-center">
                                                <span class="text-sm font-medium">${type}:</span>
                                                <span class="text-sm">
                                                    ${metrics.stallsByType[type]} cycles 
                                                    (${((metrics.stallsByType[type] || 0) / metrics.totalStalls * 100).toFixed(1)}%)
                                                </span>
                                            </div>
                                        ` : ''
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}

export default PerformanceMetrics;