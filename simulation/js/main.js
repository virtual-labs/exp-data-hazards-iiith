// js/main.js
import { 
    INSTRUCTION_TYPES, 
    REGISTERS, 
    DEFAULT_LATENCIES,
    isMemoryInstruction,
    formatInstruction
} from './utils/types.js';
import { validateRegisterSets } from './utils/registerSets.js';
import { simulatePipeline, generatePipelineVisualization } from './utils/pipelineScheduler.js';
import LatencyConfiguration from './components/LatencyConfiguration.js';
import ForwardingToggle from './components/ForwardingToggle.js';
import PipelineVisualization from './components/PipelineVisualization.js';
import StageEntryVisualization from './components/StageEntryVisualization.js';
import PerformanceMetrics from './components/PerformanceMetrics.js';

class PipelineSimulatorApp {
    constructor() {
        this.instructions = [];
        this.latencies = { ...DEFAULT_LATENCIES };
        this.forwardingEnabled = false; // Default: no forwarding
        this.initializeComponents();
        this.setupEventListeners();
        this.setupInstructionBuilder();
    }

    initializeComponents() {
        // Initialize all visualization components
        this.latencyConfig = new LatencyConfiguration(
            document.getElementById('latency-configuration'),
            this.latencies,
            this.handleLatencyChange.bind(this)
        );

        // Add forwarding toggle component
        this.forwardingToggle = new ForwardingToggle(
            document.getElementById('forwarding-toggle-container'),
            this.forwardingEnabled,
            this.handleForwardingToggle.bind(this)
        );

        this.pipelineViz = new PipelineVisualization(
            document.getElementById('pipeline-visualization')
        );

        this.stageEntryViz = new StageEntryVisualization(
            document.getElementById('stage-entry-visualization')
        );

        this.performanceMetrics = new PerformanceMetrics(
            document.getElementById('performance-metrics')
        );
    }

    setupInstructionBuilder() {
        const instructionType = document.getElementById('instruction-type');
        const rd = document.getElementById('rd');
        const rs1 = document.getElementById('rs1');
        const rs2 = document.getElementById('rs2');
        const offset = document.getElementById('offset');

        // Populate register selects
        [rd, rs1, rs2].forEach(select => {
            if (select) {
                REGISTERS.forEach(reg => {
                    const option = document.createElement('option');
                    option.value = reg;
                    option.textContent = reg;
                    select.appendChild(option);
                });
            }
        });

        // Add instruction types
        INSTRUCTION_TYPES.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            instructionType.appendChild(option);
        });
    }

    setupEventListeners() {
        // Instruction type change handler
        document.getElementById('instruction-type').addEventListener('change', (e) => {
            this.updateInstructionFields(e.target.value);
        });

        // Add instruction handler
        document.getElementById('add-instruction').addEventListener('click', () => {
            this.addInstruction();
        });

        // Clear all instructions handler
        document.getElementById('clear-instructions').addEventListener('click', () => {
            this.instructions = [];
            this.updateSimulation();
            this.updateInstructionList(); // Explicitly update instruction list
        });
    }

    updateInstructionFields(type) {
        const rd = document.getElementById('rd');
        const rs2 = document.getElementById('rs2');
        const offset = document.getElementById('offset');

        if (type === 'STORE') {
            rd.classList.add('hidden');
            rs2.classList.remove('hidden');
            offset.classList.remove('hidden');
        } else if (type === 'LOAD') {
            rd.classList.remove('hidden');
            rs2.classList.add('hidden');
            offset.classList.remove('hidden');
        } else {
            rd.classList.remove('hidden');
            rs2.classList.remove('hidden');
            offset.classList.add('hidden');
        }
    }

    handleLatencyChange(newLatencies) {
        this.latencies = newLatencies;
        this.latencyConfig.update(newLatencies); // Update the UI to reflect new latency values
        this.updateSimulation();
    }

    handleForwardingToggle(enabled) {
        this.forwardingEnabled = enabled;
        this.updateSimulation();
    }

    addInstruction() {
        const type = document.getElementById('instruction-type').value;
        const rd = document.getElementById('rd').value;
        const rs1 = document.getElementById('rs1').value;
        const rs2 = document.getElementById('rs2').value;
        const offset = document.getElementById('offset').value;

        const instruction = {
            type,
            rd: type === 'STORE' ? undefined : rd,
            rs1,
            rs2: type === 'LOAD' ? undefined : rs2,
            offset: isMemoryInstruction(type) ? offset : undefined,
            id: Math.random().toString(36).substr(2, 9)
        };

        const validation = validateRegisterSets(instruction);
        if (!validation.valid) {
            document.getElementById('validation-error').textContent = validation.error;
            return;
        }

        document.getElementById('validation-error').textContent = '';
        this.instructions.push(instruction);
        this.updateSimulation();
        this.updateInstructionList();
    }

    updateInstructionList() {
        const listContainer = document.getElementById('instruction-list');
        listContainer.innerHTML = this.instructions.map((instr, index) => `
            <div class="p-3 bg-gray-50 rounded-lg flex items-center justify-between cursor-move hover:bg-gray-100"
                 draggable="true"
                 data-index="${index}">
                <div class="font-mono">
                    ${index + 1}. ${formatInstruction(instr)}
                </div>
                <button class="text-red-500 hover:text-red-700 px-2" data-action="remove" data-index="${index}">×</button>
            </div>
        `).join('');

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const items = document.querySelectorAll('#instruction-list > div');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.index);
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = parseInt(e.target.closest('[data-index]').dataset.index);
                
                if (fromIndex !== toIndex) {
                    const [instruction] = this.instructions.splice(fromIndex, 1);
                    this.instructions.splice(toIndex, 0, instruction);
                    this.updateSimulation();
                    this.updateInstructionList();
                }
            });

            // Remove instruction handler
            item.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.instructions.splice(index, 1);
                this.updateSimulation();
                this.updateInstructionList();
            });
        });
    }

    updateSimulation() {
        // Clear instruction list first if no instructions
        if (this.instructions.length === 0) {
            const listContainer = document.getElementById('instruction-list');
            listContainer.innerHTML = '';
            document.getElementById('simulation-container').classList.add('hidden');
            return;
        }
    
        document.getElementById('simulation-container').classList.remove('hidden');
        
        // Always run simulation with current forwarding setting
        const { timeline, hazards } = simulatePipeline(
            this.instructions, 
            this.latencies, 
            this.forwardingEnabled
        );
        
        // Always also run the simulation with forwarding disabled for accurate comparison
        const { timeline: timelineWithoutForwarding, hazards: hazardsWithoutForwarding } = 
            simulatePipeline(this.instructions, this.latencies, false);
        
        const visualizedTimeline = generatePipelineVisualization(timeline);
    
        this.pipelineViz.render(visualizedTimeline, this.forwardingEnabled);
        this.stageEntryViz.render(visualizedTimeline, this.forwardingEnabled);
        
        // Pass both simulation results to the metrics component
        this.performanceMetrics.render(
            visualizedTimeline, 
            hazards, 
            this.forwardingEnabled,
            generatePipelineVisualization(timelineWithoutForwarding),
            hazardsWithoutForwarding
        );
        
        this.updateInstructionList(); // Make sure instruction list is always in sync
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PipelineSimulatorApp();
});