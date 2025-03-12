/**
 * Main application controller for the BLDC Motor Designer
 * 
 * This file initializes the application and connects the UI with the
 * calculator and visualizer components.
 */
import MotorCalculator from './motor-calculator.js';
import MotorVisualizer from './motor-visualizer.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize calculator and visualizer
    const calculator = new MotorCalculator();
    const visualizer = new MotorVisualizer(document.getElementById('motor-svg'));
    
    // Get DOM elements
    const calculateBtn = document.getElementById('calculate-btn');
    const exportBtn = document.getElementById('export-btn');
    const resultsContainer = document.getElementById('results-container');
    const fluxVisualizationDiv = document.getElementById('flux-visualization');
    const advancedParametersDiv = document.getElementById('advanced-parameters');
    
    // Last calculated design (for export and flux visualization)
    let currentMotorDesign = null;
    
    // Set up tab switching
    setupTabs();
    
    // Set up event listeners
    calculateBtn.addEventListener('click', calculateMotorDesign);
    exportBtn.addEventListener('click', exportMotorDesign);
    
    // Initialize form with default values
    initializeForm();
    
    /**
     * Initialize the form with default values and validation
     */
    function initializeForm() {
        // Add input validation for numeric fields
        const numericInputs = document.querySelectorAll('input[type="number"]');
        numericInputs.forEach(input => {
            input.addEventListener('change', () => {
                // Ensure value is within min/max range
                const min = parseFloat(input.getAttribute('min'));
                const max = parseFloat(input.getAttribute('max'));
                const value = parseFloat(input.value);
                
                if (value < min) input.value = min;
                if (value > max) input.value = max;
            });
        });
        
        // Ensure min diameter is always less than max diameter
        const minDiameterInput = document.getElementById('min-diameter');
        const maxDiameterInput = document.getElementById('max-diameter');
        
        minDiameterInput.addEventListener('change', () => {
            const minValue = parseFloat(minDiameterInput.value);
            const maxValue = parseFloat(maxDiameterInput.value);
            
            if (minValue >= maxValue) {
                maxDiameterInput.value = minValue + 10;
            }
        });
        
        maxDiameterInput.addEventListener('change', () => {
            const minValue = parseFloat(minDiameterInput.value);
            const maxValue = parseFloat(maxDiameterInput.value);
            
            if (maxValue <= minValue) {
                minDiameterInput.value = maxValue - 10;
            }
        });
    }
    
    /**
     * Set up tab switching functionality
     */
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                
                // Update active button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active content
                tabContents.forEach(tab => tab.classList.remove('active'));
                document.getElementById(`${tabName}-tab`).classList.add('active');
                
                // If switching to magnetic flux tab, generate flux visualization
                if (tabName === 'magnetic-flux' && currentMotorDesign) {
                    visualizer.drawMagneticFlux(currentMotorDesign, fluxVisualizationDiv);
                }
                
                // If switching to advanced tab, display advanced parameters
                if (tabName === 'advanced' && currentMotorDesign) {
                    displayAdvancedParameters(currentMotorDesign);
                }
            });
        });
    }
    
    /**
     * Calculate motor design based on form inputs
     */
    function calculateMotorDesign() {
        // Get input parameters
        const params = {
            wireThickness: parseFloat(document.getElementById('wire-gauge').value),
            magnetWidth: parseFloat(document.getElementById('magnet-width').value),
            magnetHeight: parseFloat(document.getElementById('magnet-height').value),
            magnetThickness: parseFloat(document.getElementById('magnet-thickness').value),
            minDiameter: parseFloat(document.getElementById('min-diameter').value),
            maxDiameter: parseFloat(document.getElementById('max-diameter').value),
            targetKV: parseFloat(document.getElementById('motor-kv').value)
        };
        
        // Calculate motor design
        const motorDesign = calculator.calculateMotorDesign(params);
        currentMotorDesign = motorDesign;
        
        // Display the visualization
        visualizer.drawMotor(motorDesign);
        
        // Display results
        displayResults(motorDesign);
        
        // Update magnetic flux and advanced tabs if they're active
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        if (activeTab === 'magnetic-flux') {
            visualizer.drawMagneticFlux(motorDesign, fluxVisualizationDiv);
        } else if (activeTab === 'advanced') {
            displayAdvancedParameters(motorDesign);
        }
    }
    
    /**
     * Display the calculation results in the UI
     * @param {object} design - The calculated motor design
     */
    function displayResults(design) {
        const kvError = Math.abs(design.estimatedKV - document.getElementById('motor-kv').value) / document.getElementById('motor-kv').value * 100;
        
        let resultsHTML = `
            <div class="parameter-group">
                <h3>Motor Configuration</h3>
                <div class="parameter">
                    <span class="parameter-name">Configuration:</span>
                    <span class="parameter-value">${design.slotCount}S${design.poleCount}P</span>
                </div>
                <div class="parameter">
                    <span class="parameter-name">Winding Type:</span>
                    <span class="parameter-value">${design.windingType || 'N/A'}</span>
                </div>
                <div class="parameter">
                    <span class="parameter-name">Outer Diameter:</span>
                    <span class="parameter-value">${design.motorDiameter.toFixed(1)} mm</span>
                </div>
                <div class="parameter">
                    <span class="parameter-name">Stator Diameter:</span>
                    <span class="parameter-value">${design.statorOuterDiameter.toFixed(1)} mm</span>
                </div>
                <div class="parameter">
                    <span class="parameter-name">Airgap:</span>
                    <span class="parameter-value">${design.airgap.toFixed(2)} mm</span>
                </div>
            </div>
            
            <div class="parameter-group">
                <h3>Winding Details</h3>
                <div class="parameter">
                    <span class="parameter-name">Wire Diameter:</span>
                    <span class="parameter-value">${design.wireDiameter.toFixed(2)} mm</span>
                </div>
                <div class="parameter">
                    <span class="parameter-name">Turns per Coil:</span>
                    <span class="parameter-value">${design.turnsPerCoil}</span>
                </div>
                <div class="parameter">
                    <span class="parameter-name">Number of Coils:</span>
                    <span class="parameter-value">${design.slotCount}</span>
                </div>
            </div>
            
            <div class="parameter-group">
                <h3>Magnet Details</h3>
                <div class="parameter">
                    <span class="parameter-name">Number of Magnets:</span>
                    <span class="parameter-value">${design.poleCount}</span>
                </div>
                <div class="parameter">
                    <span class="parameter-name">Magnet Width:</span>
                    <span class="parameter-value">${design.magnetWidth.toFixed(1)} mm</span>
                </div>
                <div class="parameter">
                    <span class="parameter-name">Magnet Height:</span>
                    <span class="parameter-value">${design.magnetHeight.toFixed(1)} mm</span>
                </div>
                <div class="parameter">
                    <span class="parameter-name">Magnet Thickness:</span>
                    <span class="parameter-value">${design.magnetThickness.toFixed(1)} mm</span>
                </div>
            </div>
            
            <div class="parameter-group">
                <h3>Performance Estimates</h3>
                <div class="parameter">
                    <span class="parameter-name">Estimated KV:</span>
                    <span class="parameter-value">${Math.round(design.estimatedKV)} RPM/V</span>
                </div>
        `;
        
        if (kvError > 20) {
            resultsHTML += `
                <div class="alert">
                    <strong>Note:</strong> The estimated KV differs significantly from your target. Consider adjusting the design parameters.
                </div>
            `;
        }
        
        resultsHTML += `
                <div class="parameter">
                    <span class="parameter-name">Efficiency:</span>
                    <span class="parameter-value">${(design.efficiency * 100).toFixed(1)}%</span>
                </div>
                <div class="efficiency-meter">
                    <div class="efficiency-value" style="width: ${design.efficiency * 100}%"></div>
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = resultsHTML;
    }
    
    /**
     * Display advanced parameters for the motor design
     * @param {object} design - The calculated motor design
     */
    function displayAdvancedParameters(design) {
        // Create table for advanced parameters
        let html = `
            <table class="advanced-table" style="width:100%; border-collapse:collapse; margin-top:10px;">
                <tr>
                    <th style="text-align:left; padding:5px; border-bottom:1px solid #ddd;">Parameter</th>
                    <th style="text-align:right; padding:5px; border-bottom:1px solid #ddd;">Value</th>
                </tr>
        `;
        
        // Add calculated parameters
        const params = [
            { name: "Least Common Multiple (Slots/Poles)", value: design.lcm || 'N/A' },
            { name: "Cogging Torque Factor", value: design.coggingFactor || 'N/A' },
            { name: "Wire Area", value: `${(calculator.calculateWireProperties(design.wireDiameter).area).toFixed(2)} mm²` },
            { name: "Maximum Turns per Coil", value: design.maxTurnsPerCoil },
            { name: "Fill Factor", value: `${((design.turnsPerCoil / design.maxTurnsPerCoil) * 100).toFixed(1)}%` },
            { name: "Phase Resistance (est.)", value: design.phaseResistance ? `${design.phaseResistance.toFixed(3)} Ω` : 'N/A' },
            { name: "Estimated Weight", value: design.estimatedWeight ? `${design.estimatedWeight.toFixed(1)} g` : 'N/A' },
            { name: "KV Deviation", value: `${design.kvDeviation?.toFixed(1)}%` },
            { name: "Magnet Arc Length", value: design.magnetArcLength ? `${design.magnetArcLength.toFixed(1)} mm` : 'N/A' },
            { name: "Magnet Gap", value: design.magnetGap ? `${design.magnetGap.toFixed(1)} mm` : 'N/A' }
        ];
        
        // Add rows to table
        params.forEach(param => {
            html += `
                <tr>
                    <td style="padding:5px; border-bottom:1px solid #eee;">${param.name}</td>
                    <td style="text-align:right; padding:5px; border-bottom:1px solid #eee;">${param.value}</td>
                </tr>
            `;
        });
        
        html += `</table>`;
        
        // Add explanation
        html += `
            <div style="margin-top:20px; font-size:12px; color:#666;">
                <p><strong>Least Common Multiple (LCM):</strong> Higher values result in lower cogging torque and smoother operation.</p>
                <p><strong>Fill Factor:</strong> Percentage of slot area filled with copper. Higher is better for efficiency.</p>
                <p><strong>KV Deviation:</strong> Difference between estimated and target KV. Lower is better.</p>
            </div>
        `;
        
        advancedParametersDiv.innerHTML = html;
    }
    
    /**
     * Export the current motor design as SVG
     */
    function exportMotorDesign() {
        if (!currentMotorDesign) {
            alert("Please calculate a motor design first");
            return;
        }
        
        const svgUrl = visualizer.exportSVG();
        
        // Create download link
        const link = document.createElement("a");
        link.href = svgUrl;
        link.download = `bldc_motor_${currentMotorDesign.slotCount}S${currentMotorDesign.poleCount}P.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up URL object
        URL.revokeObjectURL(svgUrl);
    }
});
