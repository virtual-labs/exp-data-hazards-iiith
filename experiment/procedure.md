## 📋 **Simulation Instructions**

This interactive pipeline simulator helps you visualize data hazards and understand how instruction scheduling and data forwarding affect pipeline performance.

---

### **Step 1: Build Your Instruction Sequence**

1. **Select Instruction Type** from the dropdown menu:
   - **Compute Instructions**: ADD, SUB, MUL, DIV
   - **Memory Instructions**: LOAD, STORE

2. **Choose Registers**:
   - **Destination (rd)**: Register where the result will be written (not applicable for STORE)
   - **Source 1 (rs1)**: First source register
   - **Source 2 (rs2)**: Second source register (not applicable for LOAD)
   - **Offset**: Memory offset for LOAD/STORE instructions

3. **Click "Add Instruction"** to add it to your sequence

4. **Build a sequence** of at least 2-3 instructions to observe data hazards

**Example Sequence to Try:**
```
1. ADD R1, R2, R3    (R1 = R2 + R3)
2. SUB R4, R1, R5    (R4 = R1 - R5)  ← RAW hazard on R1
3. MUL R6, R4, R7    (R6 = R4 * R7)  ← RAW hazard on R4
```

---

### **Step 2: Configure Instruction Latencies (Optional)**

Each instruction type has configurable execution latencies:

- **Compute Instructions** (ADD, SUB, MUL, DIV): Configure Execute stage cycles
- **Memory Instructions** (LOAD, STORE): Configure Memory stage cycles

**Default Latencies:**
- ADD/SUB: 1 cycle (Execute)
- MUL: 3 cycles (Execute)
- DIV: 4 cycles (Execute)
- LOAD/STORE: 2 cycles (Memory)

**To Modify:**
1. Locate the instruction type in the "Instruction Latencies" section
2. Change the cycle count in the input field
3. The simulation updates automatically

**To Reset:**
- Click **"Reset to Defaults"** to restore original latency values

---

### **Step 3: Toggle Data Forwarding**

Data forwarding (bypassing) allows results to be passed directly between pipeline stages without waiting for write-back.

- **Forwarding OFF** (default): Instructions must wait for results to be written to the register file
- **Forwarding ON**: Results can be forwarded from Execute/Memory stages, reducing stalls

**To Toggle:**
1. Use the **"Enable Data Forwarding"** checkbox
2. Observe how the pipeline visualization changes
3. Compare performance metrics with and without forwarding

---

### **Step 4: Analyze the Pipeline Visualization**

Once you add instructions, three visualization panels appear:

#### **A. Pipeline Stage Diagram**
- Shows each instruction progressing through pipeline stages (F → D → E → M → W)
- **Colored cells**: Active execution in that stage
- **Gray cells (stall)**: Pipeline stall due to data hazard
- **Hazard indicators**: Red markers show where hazards occur

#### **B. Stage Entry Timeline**
- Displays the cycle number when each instruction enters each stage
- Helps identify delays and stall patterns
- Shows the impact of hazards on instruction flow

#### **C. Performance Metrics**
- **Total Cycles**: Total execution time for the instruction sequence
- **Stall Cycles**: Number of cycles wasted due to hazards
- **CPI (Cycles Per Instruction)**: Average cycles per instruction
- **Throughput**: Instructions completed per cycle
- **Comparison**: Shows improvement when forwarding is enabled

---

### **Step 5: Reorder Instructions (Instruction Scheduling)**

You can manually reorder instructions to reduce hazards:

1. **Drag and drop** instructions in the "Instruction Sequence" panel
2. Move independent instructions between dependent ones to fill stall slots
3. Observe how reordering affects total cycles and stalls

**Example Optimization:**
```
Original (with stalls):
1. ADD R1, R2, R3
2. SUB R4, R1, R5    ← Stalls waiting for R1

Optimized (insert independent instruction):
1. ADD R1, R2, R3
2. MUL R6, R7, R8    ← Independent, no stall
3. SUB R4, R1, R5    ← R1 now ready
```

---

### **Step 6: Remove Instructions**

- Click the **×** button next to any instruction to remove it
- Click **"Clear All Instructions"** to start over

---

### **🎯 Learning Objectives**

By completing this simulation, you will:

1. ✅ Identify **RAW (Read After Write)** data hazards in instruction sequences
2. ✅ Understand how **pipeline stalls** impact performance
3. ✅ Learn how **data forwarding** reduces stall cycles
4. ✅ Practice **instruction scheduling** to minimize hazards
5. ✅ Analyze performance metrics (CPI, throughput, stall cycles)
6. ✅ Observe the effect of different instruction latencies on pipeline behavior

---

### **💡 Tips for Experimentation**

- Start with simple 2-3 instruction sequences to understand basic hazards
- Try sequences with multiple dependencies to see cascading stalls
- Compare the same sequence with forwarding ON vs OFF
- Experiment with different latencies (e.g., increase MUL to 5 cycles)
- Use drag-and-drop to find optimal instruction ordering
- Pay attention to which registers are being read/written to identify dependencies
