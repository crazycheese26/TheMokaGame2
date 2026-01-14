import { game } from './main.js';

export class Editor {
    constructor() {
        this.ui = document.getElementById('editor-ui');
        this.palette = document.getElementById('tool-palette');
        this.isActive = false;

        this.waveEvents = []; // [{ time: 1.0, type: 'ENEMY', count: 1, pos: 'TOP' }]
        this.currentTime = 0;

        this.initUI();
    }

    initUI() {
        // Clear existing palette
        this.palette.innerHTML = '';
        this.palette.className = 'flex flex-col gap-4 text-xs font-mono';

        // Tooltip Container
        this.tooltip = document.createElement('div');
        this.tooltip.className = "text-gray-400 text-[10px] italic h-8 border-b border-gray-700 mb-2 p-1";
        this.tooltip.innerText = "Hover over controls for info...";
        this.palette.appendChild(this.tooltip);

        // Time Input
        this.addControl("Time (s)", "input", { type: "number", value: 1, id: "seq-time", step: 0.5 },
            "When does this event happen? (Seconds from start)");

        // Event Type
        this.addControl("Type", "select", { id: "seq-type", options: ["BASIC", "MOKA_BOSS", "ESPRESSO_BOT", "FRAPPE_QUEEN", "WAIT", "DIALOGUE"] },
            "Type of event. Bosses have unique behaviors.");

        // Dynamic inputs container
        this.dynamicInputs = document.createElement('div');
        this.palette.appendChild(this.dynamicInputs);

        // Initial Dynamic Render
        this.renderDynamicInputs();

        // Re-render on type change
        document.getElementById('seq-type').onchange = () => this.renderDynamicInputs();

        // Add Button
        const addBtn = document.createElement('button');
        addBtn.innerText = "➕ ADD EVENT";
        addBtn.className = "bg-neon-blue text-black font-bold py-2 rounded mt-2 hover:bg-white transition-all";
        addBtn.title = "Insert this event into the timeline.";
        addBtn.onmouseenter = () => this.tooltip.innerText = "Add this event to your level sequence.";
        addBtn.onmouseleave = () => this.tooltip.innerText = "Hover over controls for info...";
        addBtn.onclick = () => this.addEvent();
        this.palette.appendChild(addBtn);

        // Event List Container
        this.eventList = document.createElement('div');
        this.eventList.className = "flex flex-col gap-1 mt-4 max-h-64 overflow-y-auto border-t border-gray-700 pt-2";
        this.palette.appendChild(this.eventList);

        // Export/Test Bindings
        this.bindButton('btn-export-level', "Copy Level JSON to clipboard.");
        this.bindButton('btn-test-level', "Run this sequence immediately.");
        this.bindButton('btn-clear-level', "Delete all events.");

        // Definitions for inputs to reuse in addControl
        this.cachedControls = {};
    }

    bindButton(id, helpText) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.onmouseenter = () => this.tooltip.innerText = helpText;
        btn.onmouseleave = () => this.tooltip.innerText = "Hover over controls for info...";

        if (id === 'btn-export-level') {
            btn.onclick = () => {
                const json = JSON.stringify(this.waveEvents.sort((a, b) => a.time - b.time));
                navigator.clipboard.writeText(json).then(() => alert("Wave Sequence copied!"));
            };
        }
        if (id === 'btn-test-level') {
            btn.onclick = () => {
                game.start('LEVEL', { level: 999, sequence: this.waveEvents });
                this.ui.classList.add('hidden');
            };
        }
        if (id === 'btn-clear-level') {
            btn.onclick = () => {
                this.waveEvents = [];
                this.renderList();
            };
        }
    }

    renderDynamicInputs() {
        this.dynamicInputs.innerHTML = '';
        const type = document.getElementById('seq-type').value;

        if (["BASIC", "BOSS", "MOKA_BOSS", "ESPRESSO_BOT", "FRAPPE_QUEEN"].includes(type)) {
            this.addControlTo(this.dynamicInputs, "Count", "input", { type: "number", value: 1, id: "seq-count", min: 1, max: 20 }, "How many enemies to spawn.");
            this.addControlTo(this.dynamicInputs, "Spawn At", "select", { id: "seq-pos", options: ["RANDOM", "TOP", "LEFT", "RIGHT", "BOTTOM", "CIRCLE"] }, "Where enemies appear.");
        } else if (type === 'DIALOGUE') {
            this.addControlTo(this.dynamicInputs, "Text", "textarea", { id: "seq-text", rows: 3, placeholder: "Enter dialogue..." }, "Text to display to the player.");
        }
    }

    addControl(label, tag, attrs, helpText) {
        this.addControlTo(this.palette, label, tag, attrs, helpText);
    }

    addControlTo(parent, label, tag, attrs, helpText) {
        const wrap = document.createElement('div');
        wrap.className = "flex flex-col mb-2";
        wrap.innerHTML = `<label class="text-gray-500 mb-1">${label}</label>`;

        const el = document.createElement(tag);
        el.className = "bg-gray-800 border border-gray-600 text-white p-1 rounded focus:border-neon-blue outline-none w-full";
        for (let k in attrs) {
            if (k === 'options') {
                attrs[k].forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt;
                    o.innerText = opt;
                    el.appendChild(o);
                });
            } else {
                el[k] = attrs[k];
            }
        }

        el.onmouseenter = () => this.tooltip.innerText = helpText || "";
        el.onmouseleave = () => this.tooltip.innerText = "Hover over controls for info...";

        wrap.appendChild(el);
        parent.appendChild(wrap);
    }

    addEvent() {
        const time = parseFloat(document.getElementById('seq-time').value);
        const type = document.getElementById('seq-type').value;

        let data = { time, type };

        if (["BASIC", "BOSS", "MOKA_BOSS", "ESPRESSO_BOT", "FRAPPE_QUEEN"].includes(type)) {
            data.count = parseInt(document.getElementById('seq-count').value);
            data.pos = document.getElementById('seq-pos').value;
        } else if (type === 'DIALOGUE') {
            data.text = document.getElementById('seq-text').value;
        }
        // WAIT has no extra data

        this.waveEvents.push(data);
        this.waveEvents.sort((a, b) => a.time - b.time);
        this.renderList();
    }

    renderList() {
        this.eventList.innerHTML = '';
        this.waveEvents.forEach((e, i) => {
            const row = document.createElement('div');
            row.className = "flex justify-between items-center bg-gray-800 p-2 rounded border-l-2 border-neon-pink text-[10px]";

            let desc = `${e.time}s: ${e.type}`;
            if (["BASIC", "BOSS", "MOKA_BOSS", "ESPRESSO_BOT", "FRAPPE_QUEEN"].includes(e.type)) desc += ` x${e.count} (${e.pos})`;
            if (e.type === 'DIALOGUE') desc += ` "${e.text.substring(0, 10)}..."`;

            row.innerHTML = `<span>${desc}</span>`;

            const del = document.createElement('button');
            del.innerHTML = "×";
            del.className = "text-red-500 font-bold hover:text-white px-2";
            del.onclick = () => {
                this.waveEvents.splice(i, 1);
                this.renderList();
            };

            row.appendChild(del);
            this.eventList.appendChild(row);
        });
    }

    start() {
        window.gameState.mode = 'EDITOR';
        this.ui.classList.remove('hidden');
    }

    update() { }

    draw() {
        // No canvas draw needed for sequencer really
        const ctx = window.gameState.ctx;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, window.gameState.width, window.gameState.height);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "20px Orbitron";
        ctx.fillText("SEQUENCER MODE ACTIVE", window.gameState.width / 2, window.gameState.height / 2);
    }
}

