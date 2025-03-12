/**
 * BLDC Outrunner Motor Visualizer
 * 
 * This class provides methods to visualize outrunner BLDC motor designs
 * as SVG graphics, showing various components like stator, rotor, coils, and magnets.
 */
class MotorVisualizer {
    /**
     * Initialize the visualizer
     * @param {SVGElement} svgElement - The SVG element to render into
     */
    constructor(svgElement) {
        this.svg = svgElement;
        this.svgNS = "http://www.w3.org/2000/svg";
        this.mainGroup = null;
        this.viewBox = { width: 400, height: 400 };
        this.center = { x: this.viewBox.width / 2, y: this.viewBox.height / 2 };
        
        // Initialize main group for motor components
        this.initializeMainGroup();
    }
    
    /**
     * Initialize the main SVG group
     */
    initializeMainGroup() {
        // Clear any existing content
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        
        // Set viewBox
        this.svg.setAttribute("viewBox", `0 0 ${this.viewBox.width} ${this.viewBox.height}`);
        
        // Create main group
        this.mainGroup = document.createElementNS(this.svgNS, "g");
        this.mainGroup.setAttribute("id", "motor-layout");
        this.svg.appendChild(this.mainGroup);
        
        // Add placeholder text
        this.addText(
            this.center.x, 
            this.center.y, 
            "Enter parameters and click Calculate", 
            { fontSize: 16, fontWeight: "normal", textAnchor: "middle", dominantBaseline: "middle" }
        );
        
        // Add initial placeholder circle
        this.addCircle(
            this.center.x, 
            this.center.y, 
            150, 
            { fill: "#f0f0f0", stroke: "#ddd", strokeWidth: 2 }
        );
    }
    
    /**
     * Clear the visualization
     */
    clearVisualization() {
        while (this.mainGroup.firstChild) {
            this.mainGroup.removeChild(this.mainGroup.firstChild);
        }
    }
    
    /**
     * Draw the complete motor based on motor design parameters
     * @param {object} motorDesign - The calculated motor design parameters
     */
    drawMotor(motorDesign) {
        this.clearVisualization();
        
        // Calculate scale factor to fit the motor in the view
        const scaleFactor = 350 / motorDesign.motorDiameter;
        
        // Draw each component
        this.drawStator(motorDesign, scaleFactor);
        this.drawRotor(motorDesign, scaleFactor);
        this.drawCoils(motorDesign, scaleFactor);
        this.drawMagnets(motorDesign, scaleFactor);
        this.drawShaft(motorDesign, scaleFactor);
        this.drawLabels(motorDesign);
        this.drawDimensions(motorDesign, scaleFactor);
    }
    
    /**
     * Draw the stator (inner part for outrunner BLDC motors)
     * @param {object} design - Motor design parameters
     * @param {number} scale - Scale factor for dimensions
     */
    drawStator(design, scale) {
        const statorOuterRadius = design.statorOuterDiameter / 2 * scale;
        const statorInnerRadius = design.statorInnerDiameter / 2 * scale;
        
        // Draw stator outer circle
        this.addCircle(
            this.center.x, 
            this.center.y, 
            statorOuterRadius,
            { fill: "#d8d8d8", stroke: "#999", strokeWidth: 1 }
        );
        
        // Draw stator inner circle (shaft hole)
        this.addCircle(
            this.center.x,
            this.center.y,
            statorInnerRadius,
            { fill: "#white", stroke: "#999", strokeWidth: 1 }
        );
    }
    
    /**
     * Draw the rotor (outer part for outrunner BLDC motors)
     * @param {object} design - Motor design parameters
     * @param {number} scale - Scale factor for dimensions
     */
    drawRotor(design, scale) {
        const rotorOuterRadius = design.rotorDiameter / 2 * scale;
        const rotorInnerRadius = design.rotorInnerDiameter / 2 * scale;
        
        // Draw rotor outer circle (motor case)
        this.addCircle(
            this.center.x,
            this.center.y,
            rotorOuterRadius,
            { fill: "none", stroke: "#333", strokeWidth: 2 }
        );
        
        // Draw rotor inner circle (where magnets attach)
        this.addCircle(
            this.center.x,
            this.center.y,
            rotorInnerRadius,
            { fill: "none", stroke: "#555", strokeWidth: 1 }
        );
    }
    
    /**
     * Draw coils in the stator
     * @param {object} design - Motor design parameters
     * @param {number} scale - Scale factor for dimensions
     */
    drawCoils(design, scale) {
        const statorOuterRadius = design.statorOuterDiameter / 2 * scale;
        const statorInnerRadius = design.statorInnerDiameter / 2 * scale;
        const slotCount = design.slotCount;
        
        // Phase colors (3-phase motor)
        const phaseColors = ["#8b5d33", "#3d85c6", "#6aa84f"]; // Brown, Blue, Green
        
        for (let i = 0; i < slotCount; i++) {
            const startAngle = (i * 360 / slotCount) * Math.PI / 180;
            const endAngle = ((i + 1) * 360 / slotCount - 2) * Math.PI / 180;
            
            // Select color based on phase
            const phaseIndex = i % 3;
            const fillColor = phaseColors[phaseIndex];
            
            // Create coil path (sector of ring)
            const path = this.createSectorPath(
                this.center.x,
                this.center.y,
                statorInnerRadius,
                statorOuterRadius,
                startAngle,
                endAngle
            );
            
            path.setAttribute("fill", fillColor);
            path.setAttribute("stroke", "#333");
            path.setAttribute("stroke-width", "0.5");
            path.setAttribute("data-slot", i.toString());
            
            this.mainGroup.appendChild(path);
            
            // Add wire turns visual effect
            this.addCoilTexture(
                this.center.x,
                this.center.y,
                statorInnerRadius,
                statorOuterRadius,
                startAngle,
                endAngle,
                4
            );
        }
    }
    
    /**
     * Draw magnets on the rotor
     * @param {object} design - Motor design parameters
     * @param {number} scale - Scale factor for dimensions
     */
    drawMagnets(design, scale) {
        const rotorInnerRadius = design.rotorInnerDiameter / 2 * scale;
        const magnetThickness = design.magnetThickness * scale;
        const poleCount = design.poleCount;
        
        for (let i = 0; i < poleCount; i++) {
            const polarAngle = (i * 360 / poleCount) * Math.PI / 180;
            const arcAngle = (360 / poleCount) * 0.8; // Use 80% of available arc for magnet
            const halfArcAngle = (arcAngle / 2) * Math.PI / 180;
            
            // Alternate N/S poles with different colors
            const magnetColor = i % 2 === 0 ? "#ff5252" : "#4285f4";
            
            // Create magnet path (sector of ring)
            const startAngle = polarAngle - halfArcAngle;
            const endAngle = polarAngle + halfArcAngle;
            
            const path = this.createSectorPath(
                this.center.x,
                this.center.y,
                rotorInnerRadius,
                rotorInnerRadius + magnetThickness,
                startAngle,
                endAngle
            );
            
            path.setAttribute("fill", magnetColor);
            path.setAttribute("stroke", "#333");
            path.setAttribute("stroke-width", "0.5");
            path.setAttribute("data-pole", i.toString());
            
            this.mainGroup.appendChild(path);
            
            // Add N/S label to magnet
            const labelRadius = rotorInnerRadius + magnetThickness / 2;
            const labelX = this.center.x + labelRadius * Math.cos(polarAngle);
            const labelY = this.center.y + labelRadius * Math.sin(polarAngle);
            
            this.addText(
                labelX,
                labelY,
                i % 2 === 0 ? "N" : "S",
                { fill: "white", fontSize: 10, fontWeight: "bold", textAnchor: "middle", dominantBaseline: "middle" }
            );
        }
    }
    
    /**
     * Draw central motor shaft
     * @param {object} design - Motor design parameters
     * @param {number} scale - Scale factor for dimensions
     */
    drawShaft(design, scale) {
        const shaftRadius = Math.max(design.statorInnerDiameter / 4 * scale, 10);
        
        this.addCircle(
            this.center.x,
            this.center.y,
            shaftRadius,
            { fill: "#555" }
        );
    }
    
    /**
     * Draw labels and text information
     * @param {object} design - Motor design parameters
     */
    drawLabels(design) {
        // Add title
        this.addText(
            this.center.x,
            30,
            `${design.slotCount}S${design.poleCount}P Outrunner BLDC Motor`,
            { fontSize: 16, fontWeight: "bold", textAnchor: "middle" }
        );
        
        // Add diameter label
        this.addText(
            this.center.x,
            380,
            `Diameter: ${Math.round(design.motorDiameter)}mm`,
            { fontSize: 14, textAnchor: "middle" }
        );
        
        // Add KV label
        this.addText(
            this.center.x,
            360,
            `Estimated KV: ${Math.round(design.estimatedKV)} RPM/V`,
            { fontSize: 14, textAnchor: "middle" }
        );
        
        // Add configuration info
        this.addText(
            this.center.x,
            50,
            `Winding: ${design.turnsPerCoil} turns × ${design.slotCount} slots`,
            { fontSize: 12, textAnchor: "middle" }
        );
    }
    
    /**
     * Draw dimension lines for the motor
     * @param {object} design - Motor design parameters
     * @param {number} scale - Scale factor for dimensions
     */
    drawDimensions(design, scale) {
        const rotorRadius = design.rotorDiameter / 2 * scale;
        const statorOuterRadius = design.statorOuterDiameter / 2 * scale;
        const statorInnerRadius = design.statorInnerDiameter / 2 * scale;
        const airgapValue = design.airgap * scale;
        
        // Draw dimension line for motor diameter
        this.drawDimensionLine(
            this.center.x - rotorRadius, this.center.y + 100,
            this.center.x + rotorRadius, this.center.y + 100,
            `${Math.round(design.motorDiameter)}mm`,
            { fontSize: 10, arrow: true }
        );
        
        // Draw dimension line for stator diameter
        this.drawDimensionLine(
            this.center.x - statorOuterRadius, this.center.y - 80,
            this.center.x + statorOuterRadius, this.center.y - 80,
            `${Math.round(design.statorOuterDiameter)}mm`,
            { fontSize: 10, arrow: true }
        );
        
        // Draw dimension line for airgap
        this.drawDimensionLine(
            this.center.x, this.center.y - statorOuterRadius,
            this.center.x, this.center.y - statorOuterRadius - airgapValue,
            `${design.airgap.toFixed(1)}mm`,
            { fontSize: 10, arrow: true, vertical: true }
        );
    }
    
    /**
     * Helper method to add a circle to the SVG
     * @param {number} cx - Center X coordinate
     * @param {number} cy - Center Y coordinate
     * @param {number} radius - Circle radius
     * @param {object} options - Styling options
     * @return {SVGCircleElement} The created circle element
     */
    addCircle(cx, cy, radius, options = {}) {
        const circle = document.createElementNS(this.svgNS, "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", radius);
        
        // Apply styling options
        if (options.fill) circle.setAttribute("fill", options.fill);
        if (options.stroke) circle.setAttribute("stroke", options.stroke);
        if (options.strokeWidth) circle.setAttribute("stroke-width", options.strokeWidth);
        
        this.mainGroup.appendChild(circle);
        return circle;
    }
    
    /**
     * Helper method to add text to the SVG
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} content - Text content
     * @param {object} options - Styling options
     * @return {SVGTextElement} The created text element
     */
    addText(x, y, content, options = {}) {
        const text = document.createElementNS(this.svgNS, "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.textContent = content;
        
        // Apply styling options
        if (options.fill) text.setAttribute("fill", options.fill);
        if (options.fontSize) text.setAttribute("font-size", options.fontSize);
        if (options.fontWeight) text.setAttribute("font-weight", options.fontWeight);
        if (options.textAnchor) text.setAttribute("text-anchor", options.textAnchor);
        if (options.dominantBaseline) text.setAttribute("dominant-baseline", options.dominantBaseline);
        
        this.mainGroup.appendChild(text);
        return text;
    }
    
    /**
     * Create a circular sector path (for coils and magnets)
     * @param {number} cx - Center X coordinate
     * @param {number} cy - Center Y coordinate
     * @param {number} innerRadius - Inner radius
     * @param {number} outerRadius - Outer radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @return {SVGPathElement} The created path element
     */
    createSectorPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
        const path = document.createElementNS(this.svgNS, "path");
        
        // Calculate path points
        const innerStartX = cx + innerRadius * Math.cos(startAngle);
        const innerStartY = cy + innerRadius * Math.sin(startAngle);
        const innerEndX = cx + innerRadius * Math.cos(endAngle);
        const innerEndY = cy + innerRadius * Math.sin(endAngle);
        const outerStartX = cx + outerRadius * Math.cos(startAngle);
        const outerStartY = cy + outerRadius * Math.sin(startAngle);
        const outerEndX = cx + outerRadius * Math.cos(endAngle);
        const outerEndY = cy + outerRadius * Math.sin(endAngle);
        
        // Create path data
        let d = `M ${innerStartX} ${innerStartY}`;
        d += ` L ${outerStartX} ${outerStartY}`;
        d += ` A ${outerRadius} ${outerRadius} 0 0 1 ${outerEndX} ${outerEndY}`;
        d += ` L ${innerEndX} ${innerEndY}`;
        d += ` A ${innerRadius} ${innerRadius} 0 0 0 ${innerStartX} ${innerStartY}`;
        d += ` Z`;
        
        path.setAttribute("d", d);
        return path;
    }
    
    /**
     * Add texture to visualize coil windings
     * @param {number} cx - Center X coordinate
     * @param {number} cy - Center Y coordinate
     * @param {number} innerRadius - Inner radius
     * @param {number} outerRadius - Outer radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @param {number} lineCount - Number of texture lines
     */
    addCoilTexture(cx, cy, innerRadius, outerRadius, startAngle, endAngle, lineCount) {
        // Add line texture to represent wire turns
        for (let i = 1; i < lineCount; i++) {
            const radius = innerRadius + (outerRadius - innerRadius) * (i / lineCount);
            
            const path = document.createElementNS(this.svgNS, "path");
            
            const startX = cx + radius * Math.cos(startAngle);
            const startY = cy + radius * Math.sin(startAngle);
            const endX = cx + radius * Math.cos(endAngle);
            const endY = cy + radius * Math.sin(endAngle);
            
            // Create arc path
            let d = `M ${startX} ${startY}`;
            d += ` A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
            
            path.setAttribute("d", d);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "#00000022"); // Semi-transparent black
            path.setAttribute("stroke-width", "0.5");
            
            this.mainGroup.appendChild(path);
        }
    }
    
    /**
     * Draw a dimension line with arrows and text label
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {string} label - Dimension text
     * @param {object} options - Styling options
     */
    drawDimensionLine(x1, y1, x2, y2, label, options = {}) {
        const group = document.createElementNS(this.svgNS, "g");
        const line = document.createElementNS(this.svgNS, "line");
        
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "#555");
        line.setAttribute("stroke-width", "0.5");
        
        group.appendChild(line);
        
        // Add arrowheads if requested
        if (options.arrow) {
            const isVertical = options.vertical || false;
            const arrowSize = 4;
            
            // Create start arrowhead
            const startArrow = document.createElementNS(this.svgNS, "polygon");
            let startPoints;
            
            if (isVertical) {
                startPoints = `${x1},${y1} ${x1-arrowSize},${y1+arrowSize} ${x1+arrowSize},${y1+arrowSize}`;
            } else {
                startPoints = `${x1},${y1} ${x1+arrowSize},${y1-arrowSize} ${x1+arrowSize},${y1+arrowSize}`;
            }
            
            startArrow.setAttribute("points", startPoints);
            startArrow.setAttribute("fill", "#555");
            
            // Create end arrowhead
            const endArrow = document.createElementNS(this.svgNS, "polygon");
            let endPoints;
            
            if (isVertical) {
                endPoints = `${x2},${y2} ${x2-arrowSize},${y2-arrowSize} ${x2+arrowSize},${y2-arrowSize}`;
            } else {
                endPoints = `${x2},${y2} ${x2-arrowSize},${y2-arrowSize} ${x2-arrowSize},${y2+arrowSize}`;
            }
            
            endArrow.setAttribute("points", endPoints);
            endArrow.setAttribute("fill", "#555");
            
            group.appendChild(startArrow);
            group.appendChild(endArrow);
        }
        
        // Add label
        const text = document.createElementNS(this.svgNS, "text");
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        text.setAttribute("x", midX);
        text.setAttribute("y", options.vertical ? midY : midY - 5);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", options.fontSize || 12);
        text.setAttribute("fill", "#333");
        text.textContent = label;
        
        group.appendChild(text);
        this.mainGroup.appendChild(group);
    }
    
    /**
     * Export the current visualization as SVG
     * @return {string} SVG data URL
     */
    exportSVG() {
        const svgData = new XMLSerializer().serializeToString(this.svg);
        const blob = new Blob([svgData], {type: "image/svg+xml"});
        return URL.createObjectURL(blob);
    }
    
    /**
     * Create a magnetic flux visualization
     * @param {object} design - Motor design parameters
     * @param {HTMLElement} container - Container for the visualization
     */
    drawMagneticFlux(design, container) {
        // Clear container
        container.innerHTML = '';
        
        // Create new SVG for flux visualization
        const fluxSvg = document.createElementNS(this.svgNS, "svg");
        fluxSvg.setAttribute("viewBox", "0 0 400 400");
        fluxSvg.setAttribute("width", "100%");
        
        const fluxGroup = document.createElementNS(this.svgNS, "g");
        fluxSvg.appendChild(fluxGroup);
        
        // Generate flux lines
        this.generateFluxLines(design, fluxGroup);
        
        container.appendChild(fluxSvg);
    }
    
    /**
     * Generate magnetic flux lines for visualization
     * @param {object} design - Motor design parameters
     * @param {SVGGElement} group - SVG group to add flux lines to
     */
    generateFluxLines(design, group) {
        const center = { x: 200, y: 200 };
        const scale = 350 / design.motorDiameter;
        const rotorInnerRadius = design.rotorInnerDiameter / 2 * scale;
        const statorOuterRadius = design.statorOuterDiameter / 2 * scale;
        const poleCount = design.poleCount;
        
        // Draw magnets as reference
        for (let i = 0; i < poleCount; i++) {
            const polarAngle = (i * 360 / poleCount) * Math.PI / 180;
            const arcAngle = (360 / poleCount) * 0.8;
            const halfArcAngle = (arcAngle / 2) * Math.PI / 180;
            
            // Draw simplified magnet
            const startAngle = polarAngle - halfArcAngle;
            const endAngle = polarAngle + halfArcAngle;
            
            const path = this.createSectorPath(
                center.x,
                center.y,
                rotorInnerRadius,
                rotorInnerRadius + 10,
                startAngle,
                endAngle
            );
            
            path.setAttribute("fill", i % 2 === 0 ? "#ff525233" : "#4285f433");
            path.setAttribute("stroke", "none");
            
            group.appendChild(path);
            
            // Draw flux lines
            const lineCount = 5;
            const fluxRadius = statorOuterRadius + 30;
            
            for (let j = 0; j < lineCount; j++) {
                const lineAngle = startAngle + (endAngle - startAngle) * (j / (lineCount - 1));
                const fluxPath = document.createElementNS(this.svgNS, "path");
                
                const startX = center.x + rotorInnerRadius * Math.cos(lineAngle);
                const startY = center.y + rotorInnerRadius * Math.sin(lineAngle);
                
                const controlX = center.x + fluxRadius * Math.cos(lineAngle + (i % 2 === 0 ? 0.2 : -0.2));
                const controlY = center.y + fluxRadius * Math.sin(lineAngle + (i % 2 === 0 ? 0.2 : -0.2));
                
                const nextMagnetIndex = (i + (i % 2 === 0 ? 1 : -1) + poleCount) % poleCount;
                const nextPolarAngle = (nextMagnetIndex * 360 / poleCount) * Math.PI / 180;
                const nextLineAngle = nextPolarAngle + (i % 2 === 0 ? -halfArcAngle : halfArcAngle);
                
                const endX = center.x + rotorInnerRadius * Math.cos(nextLineAngle);
                const endY = center.y + rotorInnerRadius * Math.sin(nextLineAngle);
                
                // Create curved path for flux line
                let d = `M ${startX} ${startY}`;
                d += ` Q ${controlX} ${controlY} ${endX} ${endY}`;
                
                fluxPath.setAttribute("d", d);
                fluxPath.setAttribute("fill", "none");
                fluxPath.setAttribute("stroke", i % 2 === 0 ? "#ff5252" : "#4285f4");
                fluxPath.setAttribute("stroke-width", "0.8");
                fluxPath.setAttribute("stroke-dasharray", "3 2");
                
                group.appendChild(fluxPath);
                
                // Add arrow to indicate direction
                const arrowPos = 0.6; // Position along the path (0-1)
                const arrowAngle = i % 2 === 0 ? Math.PI/6 : -Math.PI/6;
                
                // Simplified arrow position calculation
                const arrowX = startX + (endX - startX) * arrowPos;
                const arrowY = startY + (endY - startY) * arrowPos;
                
                const arrowSize = 4;
                const arrowDir = Math.atan2(endY - startY, endX - startX) + arrowAngle;
                
                const arrow = document.createElementNS(this.svgNS, "polygon");
                const p1 = { x: arrowX, y: arrowY };
                const p2 = { 
                    x: arrowX - arrowSize * Math.cos(arrowDir - Math.PI/6), 
                    y: arrowY - arrowSize * Math.sin(arrowDir - Math.PI/6)
                };
                const p3 = { 
                    x: arrowX - arrowSize * Math.cos(arrowDir + Math.PI/6), 
                    y: arrowY - arrowSize * Math.sin(arrowDir + Math.PI/6)
                };
                
                arrow.setAttribute("points", `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`);
                arrow.setAttribute("fill", i % 2 === 0 ? "#ff5252" : "#4285f4");
                
                group.appendChild(arrow);
            }
        }
    }
}

// Export the visualizer
export default MotorVisualizer;
