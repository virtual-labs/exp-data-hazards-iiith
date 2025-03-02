// js/components/PerformanceMetrics.js
import { PIPELINE_STAGES, HAZARD_TYPES } from '../utils/types.js';

class PerformanceMetrics {
    constructor(container) {
        this.container = container;
    }

    calculateMetrics(timeline, hazards) {
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

        // Calculate ideal cycles (pipeline stages × instructions)
        const idealCycles = totalInstructions * PIPELINE_STAGES.length;
        const stallPercentage = maxCycle > 0 ? 
            (totalStalls / maxCycle) * 100 : 0;

        return {
            maxCycle,
            totalInstructions,
            cpi,
            stallsByType,
            totalStalls,
            idealCycles,
            stallPercentage
        };
    }

    render(timeline, hazards) {
        const metrics = this.calculateMetrics(timeline, hazards);

        this.container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                        Performance Metrics
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                    </h2>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-500">Total Cycles</div>
                            <div class="text-2xl font-bold">${metrics.maxCycle}</div>
                            <div class="text-xs text-gray-500">
                                Ideal: ${metrics.idealCycles}
                            </div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-500">Instructions</div>
                            <div class="text-2xl font-bold">${metrics.totalInstructions}</div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-500">CPI</div>
                            <div class="text-2xl font-bold">${metrics.cpi.toFixed(2)}</div>
                            <div class="text-xs text-gray-500">Ideal: 1.00</div>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="text-sm text-gray-500">Total Stalls</div>
                            <div class="text-2xl font-bold">${metrics.totalStalls}</div>
                            <div class="text-xs text-gray-500">
                                ${metrics.stallPercentage.toFixed(1)}% of cycles
                            </div>
                        </div>
                        ${Object.keys(metrics.stallsByType).length > 0 ? `
                            <div class="p-4 bg-gray-50 rounded-lg col-span-2">
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
