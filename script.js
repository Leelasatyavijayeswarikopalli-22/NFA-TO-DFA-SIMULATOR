// ==========================
// DATA STRUCTURES
// ==========================

let states = [];
let alphabet = [];
let transitions = []; // {from, symbol, to}
let initialState = null;
let finalStates = new Set();


// ==========================
// UI REFRESH HELPERS
// ==========================

function refreshDropdowns() {
    let initDD = document.getElementById("initialStateDropdown");
    let finalContainer = document.getElementById("finalStatesContainer");
    let selected = initialState;

    finalContainer.innerHTML = "";
    initDD.innerHTML = "";

    states.forEach(s => {
        let opt1 = document.createElement("option");
        opt1.text = s;
        opt1.value=s;
        initDD.add(opt1);
        if (s === selected) initDD.value = s;
        
        let wrapper = document.createElement("div");

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = s;
        checkbox.checked = finalStates.has(s);

        checkbox.addEventListener("change", () => {
        if (checkbox.checked) finalStates.add(s);
        else finalStates.delete(s);
        drawNFADiagram();
    });
    initDD.value = selected;

    let label = document.createElement("label");
    label.textContent = s;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    finalContainer.appendChild(wrapper);
    });
}

function refreshAlphabet() {
    document.getElementById("alphabetList").innerHTML =
        "Alphabet: " + (alphabet.length ? alphabet.join(", ") : "∅");
}

function refreshNFATable() {
    let div = document.getElementById("nfaTable");
    div.innerHTML = "";

    if (transitions.length === 0) {
        div.innerHTML = "<i>No transitions</i>";
        return;
    }

    transitions.forEach(t => {
        div.innerHTML += `${t.from} --${t.symbol}--> ${t.to}<br>`;
    });
}

function refreshDFATable(dfaTrans) {
    let div = document.getElementById("dfaTable");
    div.innerHTML = "";

    if (dfaTrans.length === 0) {
        div.innerHTML = "<i>No transitions</i>";
        return;
    }

    dfaTrans.forEach(t => {
        div.innerHTML += `${t.from} --${t.symbol}--> ${t.to}<br>`;
    });
}


// ==========================
// STATE FUNCTIONS
// ==========================

function addState() {
    // Find smallest unused state index
    let idx = 0;
    while (states.includes("q" + idx)) {
        idx++;
    }

    let name = "q" + idx;
    states.push(name);

    refreshDropdowns();
    drawNFADiagram();
}

function removeState() {
    let name = prompt("Enter state to remove:")?.trim();

    if (!states.includes(name)) {
        alert("State not found!");
        return;
    }

    states = states.filter(s => s !== name);
    transitions = transitions.filter(t => t.from !== name && t.to !== name);

    if (initialState === name) initialState = null;
    finalStates.delete(name);

    refreshDropdowns();
    refreshNFATable();
    drawNFADiagram();
}


// ==========================
// INITIAL & FINAL STATES
// ==========================

function setInitialState() {
    initialState = document.getElementById("initialStateDropdown").value;
    drawNFADiagram();
}

// ==========================
// ALPHABET
// ==========================

function addAlphabet() {
    let sym = prompt("Enter symbol:")?.trim();

    if (!sym || alphabet.includes(sym)) return;

    alphabet.push(sym);
    refreshAlphabet();
}

function removeAlphabet() {
    let sym = prompt("Enter symbol to remove:");

    if (!alphabet.includes(sym)) {
        alert("Symbol does not exist!");
        return;
    }

    alphabet = alphabet.filter(s => s !== sym);
    transitions = transitions.filter(t => t.symbol !== sym);

    refreshAlphabet();
    refreshNFATable();
    drawNFADiagram();
}



// ==========================
// TRANSITIONS
// ==========================

function addTransition() {
    if (states.length === 0 || alphabet.length === 0) {
        alert("Add states & alphabet first!");
        return;
    }

    let from = prompt("FROM state:")?.trim();
    let symbol = prompt("Symbol:")?.trim();
    let to = prompt("TO state:")?.trim();

    if (!states.includes(from) || !states.includes(to)) {
        alert("Invalid state!");
        return;
    }
    if (!alphabet.includes(symbol) && symbol !== "eps") {
    alert("Symbol not in alphabet!");
    return;
}

    let exists = transitions.some(
        t => t.from === from && t.symbol === symbol && t.to === to
    );

    if (exists) {
        alert("Transition already exists!");
        return;
    }

    transitions.push({ from, symbol, to });

    refreshNFATable();
    drawNFADiagram();
}

function removeTransition() {
    let from = prompt("FROM state:");
    let symbol = prompt("Symbol:");
    let to = prompt("TO state:");

    transitions = transitions.filter(
        t => !(t.from === from && t.symbol === symbol && t.to === to)
    );

    refreshNFATable();
    drawNFADiagram();
}



// ==========================
// SIMULATION
// ==========================
function epsilonClosure(stateSet) {
    let stack = [...stateSet];
    let closure = new Set(stateSet);

    while (stack.length > 0) {
        let state = stack.pop();

        transitions.forEach(t => {
            if (t.from === state && t.symbol === "eps" && !closure.has(t.to)) {
                closure.add(t.to);
                stack.push(t.to);
            }
        });
    }

    return closure;
}


function simulate() {
    let input = document.getElementById("inputString").value.trim();

    if (!initialState) {
        alert("Select initial state!");
        return;
    }

    let currentStates = epsilonClosure(new Set([initialState]));

    for (let ch of input) {
        let nextStates = new Set();

        for (let state of currentStates) {
            transitions.forEach(t => {
                if (t.from === state && t.symbol === ch) {
                    nextStates.add(t.to);
                }
            });
        }

       currentStates = epsilonClosure(nextStates);
    }
for (let s of currentStates) {
    if (finalStates.has(s)) {
        alert("ACCEPTED");
        return;
    }
}

alert("REJECTED");
}

// ==========================
// NFA DIAGRAM 
// ==========================

function drawNFADiagram() {
    const div = document.getElementById("nfaDiagram");
    div.innerHTML = "<h3>NFA Diagram</h3>";

    if (states.length === 0) return;

    const perRow = 6;                     // states per row
    const rowHeight = 150;
    const colWidth = 140;

    const rows = Math.ceil(states.length / perRow);
    const svgWidth = perRow * colWidth + 100;
    const svgHeight = rows * rowHeight + 50;

    let svg = `<svg width="${svgWidth}" height="${svgHeight}">`;

    states.forEach((s, i) => {
        let row = Math.floor(i / perRow);
        let col = i % perRow;

        let cx = 80 + col * colWidth;
        let cy = 80 + row * rowHeight;

        // initial arrow
        if (initialState === s) {
            svg += `
                <line x1="${cx - 40}" y1="${cy}" x2="${cx - 20}" y2="${cy}" stroke="black"/>
                <polygon points="${cx - 20},${cy} ${cx - 30},${cy - 5} ${cx - 30},${cy + 5}" fill="black" />
            `;
        }

        // final state styling
        if (finalStates.has(s)) {
            svg += `
                <circle cx="${cx}" cy="${cy}" r="30" stroke="black" fill="white"></circle>
                <circle cx="${cx}" cy="${cy}" r="25" stroke="black" fill="white"></circle>
            `;
        } else {
            svg += `
                <circle cx="${cx}" cy="${cy}" r="30" stroke="black" fill="white"></circle>
            `;
        }

        svg += `<text x="${cx}" y="${cy + 5}" text-anchor="middle">${s}</text>`;
    });


    let grouped = {};

transitions.forEach(t => {
    let key = t.from + "-" + t.to;

    if (!grouped[key]) {
        grouped[key] = {
            from: t.from,
            to: t.to,
            symbols: []
        };
    }

   if (!grouped[key].symbols.includes(t.symbol)) {
    grouped[key].symbols.push(t.symbol);
}
});

    // Draw transitions
    Object.values(grouped).forEach(t => {
        let sameTransitions = transitions.filter(
    tr => tr.from === t.from && tr.to === t.to
);
        let offset = 0;
        let fromIdx = states.indexOf(t.from);
        let toIdx = states.indexOf(t.to);

        if (fromIdx === -1 || toIdx === -1) return;

        let fromRow = Math.floor(fromIdx / perRow);
        let fromCol = fromIdx % perRow;
        let toRow = Math.floor(toIdx / perRow);
        let toCol = toIdx % perRow;

        let x1 = 80 + fromCol * colWidth;
        let y1 = 80 + fromRow * rowHeight + 30;

        let x2 = 80 + toCol * colWidth;
        let y2 = 80 + toRow * rowHeight + 30;
    if (t.from === t.to) {

    let r = 30;
    let spread = 0;

    let startX = x1 - 5 + spread;
    let startY = y1 - r;

    let c1x = x1 - 70 + spread;
    let c1y = y1 - 120;

    let c2x = x1 + 70 + spread;
    let c2y = y1 - 120;

    let endX = x1 + 5 + spread;
    let endY = y1 - r;

    svg += `
    <path d="M ${startX} ${startY}
             C ${c1x} ${c1y},
               ${c2x} ${c2y},
               ${endX} ${endY}"
          stroke="blue"
          fill="none"
          stroke-width="2"
          marker-end="url(#arrow)"/>

    <text x="${x1 + spread}" y="${y1 - 85}" text-anchor="middle" font-weight="bold">
    ${t.symbols.join(",")}
    </text>
    `;
return;
}
let r = 30; // circle radius

let cx1 = 80 + fromCol * colWidth;
let cy1 = 80 + fromRow * rowHeight;

let cx2 = 80 + toCol * colWidth;
let cy2 = 80 + toRow * rowHeight;

// direction vector
let angle = Math.atan2(cy2 - cy1, cx2 - cx1);

// start/end on circle boundary
 x1 = cx1 + r * Math.cos(angle);
 y1 = cy1 + r * Math.sin(angle);

 x2 = cx2 - r * Math.cos(angle);
 y2 = cy2 - r * Math.sin(angle);
       let dx = x2 - x1;
let dy = y2 - y1;
let curve = 40;

// control point for curve
let curveStrength = 0.25; // smaller = closer to straight line

let cx = (x1 + x2) / 2 - dy * curveStrength + offset;
let cy = (y1 + y2) / 2 + dx * curveStrength + offset;

let labelX = (x1 + 2 * cx + x2) / 4;
let labelY = (y1 + 2 * cy + y2) / 4;

svg += `
<defs>
<marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto">
<path d="M0,0 L0,6 L9,3 z" fill="blue"/>
</marker>
</defs>

<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}"
      stroke="blue"
      fill="none"
      stroke-width="2"
      marker-end="url(#arrow)"/>

<text x="${labelX}" y="${labelY}" 
      text-anchor="middle" 
      dominant-baseline="middle"
      font-weight="bold">
${t.symbols.join(",")}
</text>
`;
    });

    svg += `</svg>`;
    div.innerHTML += svg;
}


// ==========================
// NFA → DFA Conversion
// ==========================

function convertNFAtoDFA() {
    if (!initialState) {
        alert("Choose initial state!");
        return;
    }

    let dfaStates = [];
    let queue = [];

    let start = Array.from(epsilonClosure(new Set([initialState])));
    dfaStates.push(start);
    queue.push(start);

    let dfaTrans = [];

    while (queue.length > 0) {
        let current = queue.shift();

        alphabet.filter(s => s !== "eps").forEach(symbol => {

            let moveSet = new Set();

            current.forEach(state => {
                transitions.forEach(t => {
                    if (t.from === state && t.symbol === symbol) {
                        moveSet.add(t.to);
                    }
                });
            });

           let newSet;

        if (moveSet.size === 0) {
           newSet = ["∅"];
            } else {
           let closure = epsilonClosure(moveSet);
          newSet = Array.from(closure).sort();
            }

            if (!dfaStates.some(s => JSON.stringify(s) === JSON.stringify(newSet))) {
                dfaStates.push(newSet);
                queue.push(newSet);
            }

            dfaTrans.push({
                from: current.join(","),
                symbol,
                to: newSet.join(",")
            });

        });
    }

    // dead state self loop
    if (dfaStates.some(s => s[0] === "∅")) {
        alphabet.filter(s => s !== "eps").forEach(symbol => {
        dfaTrans.push({
         from: "∅",
         symbol,
         to: "∅"
      });
   });
    }

    refreshDFATable(dfaTrans);
    drawDFADiagram(dfaStates, dfaTrans);
}


// ==========================
// DFA DIAGRAM
// ==========================

function drawDFADiagram(dfaStates, dfaTrans) {

    const div = document.getElementById("dfaDiagram");
    div.innerHTML = "<h3>DFA Diagram</h3>";

    if (dfaStates.length === 0) return;

    const perRow = 6;
    const rowHeight = 150;
    const colWidth = 140;

    const rows = Math.ceil(dfaStates.length / perRow);
    const svgWidth = perRow * colWidth + 100;
    const svgHeight = rows * rowHeight + 50;

    // find final states
    let dfaFinals = new Set();
    dfaStates.forEach(set => {
        if (set.some(s => finalStates.has(s))) {
            dfaFinals.add(set.join(","));
        }
    });

    let svg = `<svg width="${svgWidth}" height="${svgHeight}">
    <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto">
    <path d="M0,0 L0,6 L9,3 z" fill="blue"/>
    </marker>
    </defs>
    `;

    // draw states
    dfaStates.forEach((set, i) => {
        let s = set.join(",");

        let row = Math.floor(i / perRow);
        let col = i % perRow;

        let cx = 80 + col * colWidth;
        let cy = 80 + row * rowHeight;

        // initial arrow
        if (i === 0) {
            svg += `
            <line x1="${cx - 40}" y1="${cy}" x2="${cx - 20}" y2="${cy}" stroke="black"/>
            <polygon points="${cx - 20},${cy} ${cx - 30},${cy - 5} ${cx - 30},${cy + 5}" fill="black"/>
            `;
        }

        // final states
        if (dfaFinals.has(s)) {
            svg += `
            <circle cx="${cx}" cy="${cy}" r="30" stroke="black" fill="white"/>
            <circle cx="${cx}" cy="${cy}" r="25" stroke="black" fill="white"/>
            `;
        } else {
            svg += `
            <circle cx="${cx}" cy="${cy}" r="30" stroke="black" fill="white"/>
            `;
        }

        svg += `<text x="${cx}" y="${cy+5}" text-anchor="middle">${s}</text>`;
    });

    // group transitions
    let grouped = {};

    dfaTrans.forEach(t => {
        let key = t.from + "-" + t.to;

        if (!grouped[key]) {
            grouped[key] = {
                from: t.from,
                to: t.to,
                symbols: []
            };
        }

        if (!grouped[key].symbols.includes(t.symbol)) {
            grouped[key].symbols.push(t.symbol);
        }
    });

    // draw transitions
    Object.values(grouped).forEach(t => {

        let fromIdx = dfaStates.findIndex(s => s.join(",") === t.from);
        let toIdx = dfaStates.findIndex(s => s.join(",") === t.to);

        if (fromIdx === -1 || toIdx === -1) return;

        let fromRow = Math.floor(fromIdx / perRow);
        let fromCol = fromIdx % perRow;
        let toRow = Math.floor(toIdx / perRow);
        let toCol = toIdx % perRow;

        let cx1 = 80 + fromCol * colWidth;
        let cy1 = 80 + fromRow * rowHeight;

        let cx2 = 80 + toCol * colWidth;
        let cy2 = 80 + toRow * rowHeight;

        // self loop
        if (t.from === t.to) {

            let r = 30;

            svg += `
            <path d="M ${cx1-5} ${cy1-r}
                     C ${cx1-70} ${cy1-70},
                       ${cx1+70} ${cy1-70},
                       ${cx1+5} ${cy1-r}"
                  stroke="blue"
                  fill="none"
                  stroke-width="2"
                  marker-end="url(#arrow)"/>

            <text x="${cx1}" y="${cy1-68}" text-anchor="middle" font-weight="bold">
            ${t.symbols.sort().join(",")}
            </text>
            `;
            return;
        }

        let r = 30;
        let angle = Math.atan2(cy2 - cy1, cx2 - cx1);

        let x1 = cx1 + r * Math.cos(angle);
        let y1 = cy1 + r * Math.sin(angle);

        let x2 = cx2 - r * Math.cos(angle);
        let y2 = cy2 - r * Math.sin(angle);

        let dx = x2 - x1;
        let dy = y2 - y1;

        let curveStrength = 0.25;

        let cx = (x1 + x2)/2 - dy * curveStrength;
        let cy = (y1 + y2)/2 + dx * curveStrength;

        let labelX = (x1 + 2*cx + x2)/4;
        let labelY = (y1 + 2*cy + y2)/4;

        svg += `
        <path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}"
              stroke="blue"
              fill="none"
              stroke-width="2"
              marker-end="url(#arrow)"/>

        <text x="${labelX}" y="${labelY}"
              text-anchor="middle"
              dominant-baseline="middle"
              font-weight="bold">
        ${t.symbols.sort().join(",")}
        </text>
        `;
    });

    svg += `</svg>`;
    div.innerHTML += svg;
}