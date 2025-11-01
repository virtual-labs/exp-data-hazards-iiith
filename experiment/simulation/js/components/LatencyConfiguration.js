// js/components/LatencyConfiguration.js
import { 
    COMPUTE_INSTRUCTIONS, 
    MEMORY_INSTRUCTIONS, 
    DEFAULT_LATENCIES 
} from '../utils/types.js';

class LatencyConfiguration {
    constructor(container, latencies, onLatencyChange) {
        this.container = container;
        this.latencies = latencies;
        this.onLatencyChange = onLatencyChange;
        this.render();
    }

    handleLatencyChange(instruction, stage, value) {
        const newValue = Math.max(1, parseInt(value) || 1); // Ensure minimum of 1 cycle
        this.onLatencyChange({
            ...this.latencies,
            [instruction]: {
                ...this.latencies[instruction],
                [stage]: newValue
            }
        });
    }

    createLatencyItem(instr, stage) {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-4 p-2 bg-gray-50 rounded';
        
        div.innerHTML = `
            <span class="font-mono w-16">${instr}</span>
            <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600">${stage === 'execute' ? 'Execute:' : 'Memory:'}</span>
                <input
                    type="number"
                    min="1"
                    value="${this.latencies[instr][stage]}"
                    class="w-20 p-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-600">cycles</span>
            </div>
        `;

        // Add event listener to input
        const input = div.querySelector('input');
        input.addEventListener('change', (e) => {
            this.handleLatencyChange(instr, stage, e.target.value);
        });

        return div;
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="p-6">
                    <div class="flex items-center gap-2 mb-4">
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
                        </svg>
                        <h2 class="text-xl font-bold">Instruction Latencies</h2>
                    </div>
                    
                    <div class="space-y-6">
                        <!-- Compute Instructions -->
                        <div>
                            <h3 class="text-lg font-semibold mb-2">Compute Instructions</h3>
                            <div id="compute-latencies" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            </div>
                        </div>

                        <!-- Memory Instructions -->
                        <div>
                            <h3 class="text-lg font-semibold mb-2">Memory Instructions</h3>
                            <div id="memory-latencies" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            </div>
                        </div>

                        <!-- Reset Button -->
                        <div class="flex justify-end">
                            <button id="reset-latencies" 
                                    class="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                                Reset to Defaults
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add compute instruction latencies
        const computeLatencies = this.container.querySelector('#compute-latencies');
        COMPUTE_INSTRUCTIONS.forEach(instr => {
            computeLatencies.appendChild(this.createLatencyItem(instr, 'execute'));
        });

        // Add memory instruction latencies
        const memoryLatencies = this.container.querySelector('#memory-latencies');
        MEMORY_INSTRUCTIONS.forEach(instr => {
            memoryLatencies.appendChild(this.createLatencyItem(instr, 'memory'));
        });

        // Add reset button handler
        const resetButton = this.container.querySelector('#reset-latencies');
        resetButton.addEventListener('click', () => {
            // Create a deep copy of DEFAULT_LATENCIES to avoid reference issues
            const resetLatencies = JSON.parse(JSON.stringify(DEFAULT_LATENCIES));
            this.latencies = resetLatencies;
            this.onLatencyChange(resetLatencies);
            this.render(); // Re-render to update input field values
        });
    }

    update(latencies) {
        this.latencies = latencies;
        this.render();
    }
}

export default LatencyConfiguration;
