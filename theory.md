### 🔍 **Data Hazards in Pipelined Processors**

In a pipelined processor, multiple instructions are overlapped in execution across stages such as Fetch, Decode, Execute, Memory, and Write-back. However, when instructions depend on each other for data, **data hazards** arise, potentially causing incorrect execution or stalls.

#### 🔴 **Types of Data Hazards**

1. **RAW (Read After Write)** – True data dependency
2. **WAR (Write After Read)** – Anti-dependency
3. **WAW (Write After Write)** – Output dependency

The most common and critical of these is the **RAW hazard**.

---

### ⚠️ **RAW Hazard (Read After Write)**

A **RAW hazard** occurs when an instruction needs to read a register that a previous instruction is yet to write. Without proper handling, the second instruction may read stale or incorrect data.

#### 🧠 **Example:**

```asm

1. ADD R1, R2, R3   ; R1 = R2 + R3  
2. SUB R4, R1, R5   ; R4 = R1 - R5  

```

Here, the second instruction depends on the result of the first. If the pipeline does not wait for the first instruction to **write back** to `R1`, the second instruction might read an incorrect value.

---

### 🚀 **How Data Forwarding Helps**

**Data forwarding** (also known as **bypassing**) is a hardware technique that allows data to be sent directly from one pipeline stage to another, **without waiting for write-back**.

In the above example, the result of the `ADD` can be **forwarded** from the Execute or Memory stage of instruction 1 to the Execute stage of instruction 2. This reduces or even eliminates the need for stalling.

#### ✅ **Benefits of Forwarding:**

* Minimizes performance loss due to stalls
* Preserves pipeline throughput
* Enables faster execution of dependent instructions

---

By experimenting with different instruction sequences and toggling forwarding options, students can **visualize the impact of hazards and the effectiveness of scheduling and hardware optimizations** like data forwarding.
