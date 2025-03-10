// js/components/ForwardingToggle.js
/**
 * Component for toggling data forwarding in the pipeline
 * 
 * Data forwarding allows results computed in one stage to be immediately available
 * to dependent instructions without waiting for the writeback stage, reducing stalls.
 */
class ForwardingToggle {
    constructor(container, initialState, onToggleChange) {
        this.container = container;
        this.forwardingEnabled = initialState;
        this.onToggleChange = onToggleChange;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="card mb-4">
                <div class="p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <svg class="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z" />
                            </svg>
                            <h2 class="text-xl font-bold">Data Forwarding</h2>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                class="sr-only peer" 
                                id="forwarding-toggle-input"
                                ${this.forwardingEnabled ? 'checked' : ''}
                            >
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span class="ml-3 text-sm font-medium text-gray-600">
                                ${this.forwardingEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </label>
                    </div>
                    <p class="mt-2 text-sm text-gray-600">
                        ${this.forwardingEnabled ? 
                            'Data forwarding passes values directly between pipeline stages, reducing stalls from RAW hazards. ALU results are forwarded from the Execute stage, and memory values from the Memory stage.' :
                            'Without forwarding, instructions must wait for results to be written back to the register file before using them, causing more stalls for data hazards.'}
                    </p>
                </div>
            </div>
        `;

        // Add event listener to toggle
        const toggleInput = this.container.querySelector('#forwarding-toggle-input');
        toggleInput.addEventListener('change', (e) => {
            this.forwardingEnabled = e.target.checked;
            this.onToggleChange(this.forwardingEnabled);
            this.render(); // Re-render to update the descriptive text
        });
    }

    update(state) {
        this.forwardingEnabled = state;
        this.render();
    }
}

export default ForwardingToggle;