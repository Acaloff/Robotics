/**
 * BLDC Outrunner Motor Calculator
 * 
 * This class provides methods to calculate optimal parameters for
 * outrunner brushless DC motors based on input constraints.
 */
class MotorCalculator {
    constructor() {
        // Physical constants
        this.COPPER_RESISTIVITY = 1.68e-8; // Ohm·m at 20°C
        this.COPPER_DENSITY = 8960; // kg/m³
        this.NEODYMIUM_FLUX_DENSITY = 1.2; // Tesla (T) for N42 magnets
        this.AIR_PERMEABILITY = 4 * Math.PI * 1e-7; // H/m (vacuum/air permeability)
        
        // Common slot-pole combinations for BLDC motors
        this.SLOTS_POLES_COMBINATIONS = [
            { slots: 12, poles: 14, winding: "distributed", lcm: 84, coggingFactor: 7 },
            { slots: 9, poles: 10, winding: "concentrated", lcm: 90, coggingFactor: 10 },
            { slots: 12, poles: 10, winding: "distributed", lcm: 60, coggingFactor: 5 },
            { slots: 24, poles: 22, winding: "distributed", lcm: 264, coggingFactor: 11 },
            { slots: 36, poles: 42, winding: "distributed", lcm: 252, coggingFactor: 6 },
            { slots: 9, poles: 8, winding: "concentrated", lcm: 72, coggingFactor: 8 },
            { slots: 9, poles: 12, winding: "concentrated", lcm: 36, coggingFactor: 3 },
            { slots: 15, poles: 14, winding: "distributed", lcm: 210, coggingFactor: 14 },
            { slots: 18, poles: 16, winding: "distributed", lcm: 144, coggingFactor: 8 },
            { slots: 18, poles: 20, winding: "distributed", lcm: 180, coggingFactor: 10 },
            { slots: 27, poles: 24, winding: "distributed", lcm: 216, coggingFactor: 8 },
            { slots: 21, poles: 22, winding: "distributed", lcm: 462, coggingFactor: 22 },
            { slots: 6, poles: 8, winding: "concentrated", lcm: 24, coggingFactor: 2 }
        ];
        
        // Wire gauge table (AWG to diameter in mm)
        this.WIRE_GAUGE_TABLE = {
            8: 3.264, 10: 2.588, 12: 2.053, 14: 1.628,
            16: 1.291, 18: 1.024, 20: 0.812, 22: 0.644,
            24: 0.511, 26: 0.405, 28: 0.321, 30: 0.255,
            32: 0.202, 34: 0.160, 36: 0.127, 38: 0.101
        };
    }

    /**
     * Calculate wire properties based on diameter
     * @param {number} wireDiameter - Wire diameter in mm
     * @return {object} Wire properties
     */
    calculateWireProperties(wireDiameter) {
        // Convert to meters for SI units
        const wireDiameterM = wireDiameter / 1000;
        
        // Calculate cross-sectional area
        const wireArea = Math.PI * Math.pow(wireDiameterM / 2, 2);
        
        // Calculate current capacity (conservative estimate)
        const currentCapacity = wireArea * 5e6; // Approx 5 A/mm²
        
        // Calculate resistance per meter
        const resistancePerMeter = this.COPPER_RESISTIVITY / wireArea;
        
        // Calculate mass per meter
        const massPerMeter = wireArea * this.COPPER_DENSITY;
        
        return {
            diameter: wireDiameter,
            area: wireArea * 1e6, // in mm²
            currentCapacity: currentCapacity,
            resistancePerMeter: resistancePerMeter,
            massPerMeter: massPerMeter
        };
    }

    /**
     * Convert AWG to wire diameter in mm
     * @param {number} awg - AWG wire gauge
     * @return {number} Wire diameter in mm
     */
    awgToDiameter(awg) {
        if (this.WIRE_GAUGE_TABLE[awg]) {
            return this.WIRE_GAUGE_TABLE[awg];
        }
        
        // If AWG is not in the table, calculate using the formula
        return 0.127 * Math.pow(92, (36 - awg) / 39);
    }

    /**
     * Calculate optimal slot-pole configuration for given diameter
     * @param {number} minDiameter - Minimum target diameter in mm
     * @param {number} maxDiameter - Maximum target diameter in mm
     * @param {number} targetKv - Target motor KV (RPM/V)
     * @return {object} Optimal slot-pole configuration
     */
    calculateConfiguration(minDiameter, maxDiameter, targetKv) {
        // Find appropriate slot/pole combination for the diameter range
        let suitableConfigs = [];
        const avgDiameter = (minDiameter + maxDiameter) / 2;
        
        for (const config of this.SLOTS_POLES_COMBINATIONS) {
            // Calculate approximate stator diameter based on slots & poles
            const minSlotPitch = 5; // Minimum mm per slot
            const minDiameterNeeded = config.slots * minSlotPitch / Math.PI;
            
            if (minDiameterNeeded <= maxDiameter) {
                // Calculate pole pitch (mm of circumference per pole)
                const polePitch = Math.PI * avgDiameter / config.poles;
                
                // Score based on cogging torque factor (higher LCM is better)
                // Also consider KV potential (higher pole count allows lower KV)
                const coggingScore = config.lcm / 100;
                const kvSuitabilityScore = 1 - Math.abs(targetKv - 1000 / config.poles) / 2000;
                const sizeScore = 1 - Math.abs(avgDiameter - minDiameterNeeded) / avgDiameter;
                
                const totalScore = coggingScore * 0.4 + kvSuitabilityScore * 0.4 + sizeScore * 0.2;
                
                suitableConfigs.push({
                    ...config,
                    polePitch,
                    score: totalScore
                });
            }
        }
        
        // Sort by score and pick the best one
        suitableConfigs.sort((a, b) => b.score - a.score);
        
        if (suitableConfigs.length === 0) {
            // If no suitable configuration, return a reasonable default
            return {
                slots: 12,
                poles: 14,
                winding: "distributed",
                polePitch: Math.PI * avgDiameter / 14,
                coggingFactor: 7
            };
        }
        
        return suitableConfigs[0];
    }

    /**
     * Calculate coil dimensions and parameters
     * @param {number} motorDiameter - Motor outer diameter in mm
     * @param {object} config - Slot-pole configuration
     * @param {number} wireDiameter - Wire diameter in mm
     * @param {number} targetKv - Target motor KV
     * @return {object} Coil dimensions and parameters
     */
    calculateCoilDimensions(motorDiameter, config, wireDiameter, targetKv) {
        // For outrunner, calculate appropriate stator and rotor dimensions
        const statorOuterDiameter = motorDiameter * 0.7; // Stator is ~70% of total diameter
        const statorInnerDiameter = statorOuterDiameter * 0.5; // Inner diameter typically 50% of outer
        
        // Calculate slot dimensions
        const slotCount = config.slots;
        const slotPitch = Math.PI * statorOuterDiameter / slotCount;
        const slotWidth = slotPitch * 0.7; // 70% of pitch is slot width
        const slotDepth = (statorOuterDiameter - statorInnerDiameter) / 2;
        
        // Calculate slot area (approximate as trapezoid)
        const slotInnerWidth = slotWidth * statorInnerDiameter / statorOuterDiameter;
        const slotArea = (slotWidth + slotInnerWidth) / 2 * slotDepth;
        
        // Calculate wire properties
        const wireProps = this.calculateWireProperties(wireDiameter);
        
        // Calculate turns per coil
        // First, calculate max possible turns based on area
        const fillFactor = 0.45; // Typical fill factor for hand-wound motors
        const wireAreaMm2 = wireProps.area; // Wire cross section in mm²
        const maxTurnsPerCoil = Math.floor(slotArea * fillFactor / wireAreaMm2);
        
        // Now adjust turns based on target KV
        // KV is inversely proportional to turns and poles
        const fluxPerPole = this.NEODYMIUM_FLUX_DENSITY * 0.0001; // Approximate flux per pole
        const turnsForTargetKv = 1 / (targetKv * fluxPerPole * config.poles / 60);
        
        // Adjust turns per phase based on winding pattern
        const turnsPerPhase = config.winding === "distributed" 
            ? turnsForTargetKv / (config.slots / 3)
            : turnsForTargetKv / (config.slots / 3 * 2);
        
        // Final turns per coil (cannot exceed physical limit)
        const turnsPerCoil = Math.min(maxTurnsPerCoil, Math.round(turnsPerPhase));
        
        return {
            statorInnerDiameter,
            statorOuterDiameter,
            slotWidth,
            slotDepth,
            slotArea,
            turnsPerCoil,
            maxTurnsPerCoil,
            wireResistancePerMeter: wireProps.resistancePerMeter,
            massPerMeter: wireProps.massPerMeter
        };
    }

    /**
     * Calculate magnet dimensions and parameters
     * @param {number} motorDiameter - Motor outer diameter in mm
     * @param {number} poleCount - Number of poles (magnets)
     * @param {number} magnetWidth - Input magnet width in mm
     * @param {number} magnetHeight - Input magnet height in mm
     * @return {object} Magnet parameters
     */
    calculateMagnetParameters(motorDiameter, poleCount, magnetWidth, magnetHeight) {
        // Calculate rotor dimensions (for outrunner)
        const rotorInnerDiameter = motorDiameter * 0.75; // Typically 75% of motor diameter
        const rotorOuterDiameter = motorDiameter;
        
        // Calculate arc length per pole
        const polarAngle = 360 / poleCount; // Angle in degrees
        const arcLength = Math.PI * rotorInnerDiameter * polarAngle / 360;
        
        // Adjust magnet width to fit nicely
        const magnetGap = arcLength * 0.1; // Leave 10% gap between magnets
        const adjustedMagnetWidth = Math.min(magnetWidth, arcLength - magnetGap);
        
        // Adjust magnet height if needed
        const rotorThickness = (rotorOuterDiameter - rotorInnerDiameter) / 2;
        const adjustedMagnetHeight = Math.min(magnetHeight, rotorThickness * 0.9);
        
        return {
            rotorInnerDiameter,
            rotorOuterDiameter,
            polarAngle,
            arcLength,
            magnetWidth: adjustedMagnetWidth,
            magnetHeight: adjustedMagnetHeight,
            magnetGap
        };
    }

    /**
     * Calculate airgap (distance between stator and magnets)
     * @param {number} motorDiameter - Motor diameter in mm
     * @return {number} Recommended airgap in mm
     */
    calculateAirgap(motorDiameter) {
        // Larger motors need larger airgaps
        const baseAirgap = 0.5; // Minimum airgap in mm
        const diameterFactor = motorDiameter / 200; // Scale factor
        
        return baseAirgap + diameterFactor * 0.5;
    }

    /**
     * Calculate back EMF and KV rating
     * @param {number} poleCount - Number of magnetic poles
     * @param {number} turnsPerCoil - Number of turns per coil
     * @param {number} slotCount - Number of slots
     * @param {number} magnetStrength - Magnet strength in Tesla
     * @return {number} KV rating in RPM/V
     */
    calculateKV(poleCount, turnsPerCoil, slotCount, magnetStrength = 1.2) {
        // For a 3-phase motor
        const phasesCount = 3;
        const turnsPerPhase = turnsPerCoil * (slotCount / phasesCount);
        
        // Simplified KV calculation
        // KV is inversely proportional to pole count and turns
        const kvFactor = 1352; // Empirical factor
        
        return kvFactor / (poleCount * Math.sqrt(turnsPerPhase) * (magnetStrength / 1.2));
    }

    /**
     * Calculate motor efficiency
     * @param {object} motorParams - Motor parameters
     * @return {number} Estimated efficiency (0-1)
     */
    calculateEfficiency(motorParams) {
        // Simplified efficiency model based on key parameters
        // Real efficiency depends on many factors including construction quality
        
        // Base efficiency for BLDC motors is quite high
        let efficiency = 0.82;
        
        // Larger pole count generally increases efficiency
        efficiency += (motorParams.poleCount / 40) * 0.05;
        
        // LCM of poles and slots (lower cogging torque improves efficiency)
        const coggingFactor = motorParams.lcm / 300;
        efficiency += coggingFactor * 0.03;
        
        // Better fill factor improves efficiency
        const fillFactor = motorParams.turnsPerCoil / motorParams.maxTurnsPerCoil;
        efficiency += fillFactor * 0.02;
        
        // Cap at realistic values
        return Math.min(0.96, efficiency);
    }

    /**
     * Main calculation function for motor design
     * @param {object} params - Input parameters
     * @return {object} Complete motor design parameters
     */
    calculateMotorDesign(params) {
        // Extract input parameters
        const {
            wireThickness,
            magnetWidth,
            magnetHeight,
            magnetThickness,
            minDiameter,
            maxDiameter,
            targetKV
        } = params;
        
        // Calculate optimal diameter
        const optimalDiameter = (minDiameter + maxDiameter) / 2;
        
        // Calculate slot-pole configuration
        const config = this.calculateConfiguration(minDiameter, maxDiameter, targetKV);
        
        // Calculate coil dimensions
        const coilDims = this.calculateCoilDimensions(
            optimalDiameter, 
            config, 
            wireThickness, 
            targetKV
        );
        
        // Calculate magnet parameters
        const magnetParams = this.calculateMagnetParameters(
            optimalDiameter,
            config.poles,
            magnetWidth,
            magnetHeight
        );
        
        // Calculate airgap
        const airgap = this.calculateAirgap(optimalDiameter);
        
        // Calculate actual KV based on parameters
        const estimatedKV = this.calculateKV(
            config.poles,
            coilDims.turnsPerCoil,
            config.slots
        );
        
        // Calculate efficiency
        const efficiency = this.calculateEfficiency({
            ...config,
            turnsPerCoil: coilDims.turnsPerCoil,
            maxTurnsPerCoil: coilDims.maxTurnsPerCoil
        });
        
        // Return complete motor design
        return {
            // General motor dimensions
            motorDiameter: optimalDiameter,
            rotorDiameter: magnetParams.rotorOuterDiameter,
            rotorInnerDiameter: magnetParams.rotorInnerDiameter,
            statorOuterDiameter: coilDims.statorOuterDiameter,
            statorInnerDiameter: coilDims.statorInnerDiameter,
            airgap,
            
            // Slot-pole configuration
            slotCount: config.slots,
            poleCount: config.poles,
            windingType: config.winding,
            lcm: config.lcm,
            coggingFactor: config.coggingFactor,
            
            // Coil parameters
            turnsPerCoil: coilDims.turnsPerCoil,
            maxTurnsPerCoil: coilDims.maxTurnsPerCoil,
            wireDiameter: wireThickness,
            
            // Magnet parameters
            magnetWidth: magnetParams.magnetWidth,
            magnetHeight: magnetParams.magnetHeight,
            magnetThickness,
            magnetArcLength: magnetParams.arcLength,
            magnetGap: magnetParams.magnetGap,
            
            // Performance estimates
            estimatedKV,
            targetKV,
            kvDeviation: Math.abs((estimatedKV - targetKV) / targetKV * 100),
            efficiency,
            
            // Additional calculations
            phaseResistance: coilDims.wireResistancePerMeter * coilDims.turnsPerCoil * config.slots / 3 * 0.2, // Approx winding length
            estimatedWeight: (coilDims.massPerMeter * coilDims.turnsPerCoil * config.slots * 0.2) + 
                            (magnetParams.magnetWidth * magnetParams.magnetHeight * magnetThickness * config.poles * 7.5 / 1000), // Approx in grams
            timestamp: new Date().toISOString()
        };
    }
}

// Export the calculator
export default MotorCalculator;
