/**
 * Unit Tests for the BLDC Motor Calculator
 * 
 * To run these tests:
 * 1. Install Jest: npm install --save-dev jest
 * 2. Run the tests: npm test
 */

import MotorCalculator from '../js/motor-calculator.js';

describe('MotorCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new MotorCalculator();
  });

  describe('calculateWireProperties', () => {
    it('should calculate correct wire properties for 0.8mm wire', () => {
      const wireProps = calculator.calculateWireProperties(0.8);
      
      // Area should be π * (0.4mm)²
      expect(wireProps.area).toBeCloseTo(0.5027, 4);
      expect(wireProps.resistancePerMeter).toBeGreaterThan(0);
      expect(wireProps.currentCapacity).toBeGreaterThan(0);
    });

    it('should scale resistivity correctly with wire diameter', () => {
      const wireProps1 = calculator.calculateWireProperties(0.5);
      const wireProps2 = calculator.calculateWireProperties(1.0);
      
      // Resistivity should be 4x higher for the thinner wire (area ratio is 1:4)
      expect(wireProps1.resistancePerMeter / wireProps2.resistancePerMeter).toBeCloseTo(4, 1);
    });
  });

  describe('awgToDiameter', () => {
    it('should convert AWG 20 to approximately 0.8mm', () => {
      expect(calculator.awgToDiameter(20)).toBeCloseTo(0.812, 2);
    });
    
    it('should convert AWG 30 to approximately 0.255mm', () => {
      expect(calculator.awgToDiameter(30)).toBeCloseTo(0.255, 2);
    });
  });

  describe('calculateConfiguration', () => {
    it('should select appropriate slot-pole combination for given diameter range', () => {
      const config = calculator.calculateConfiguration(30, 40, 800);
      
      // Should return a valid configuration
      expect(config).toHaveProperty('slots');
      expect(config).toHaveProperty('poles');
      expect(config.slots).toBeGreaterThan(0);
      expect(config.poles).toBeGreaterThan(0);
    });

    it('should pick configuration with higher score for target KV', () => {
      const config1 = calculator.calculateConfiguration(30, 40, 800);
      const config2 = calculator.calculateConfiguration(30, 40, 2000);
      
      // Should pick different configurations for very different KV targets
      expect(config1).not.toEqual(config2);
    });
  });

  describe('calculateCoilDimensions', () => {
    it('should calculate reasonable coil dimensions', () => {
      const config = { slots: 12, poles: 14, winding: 'distributed' };
      const coilDims = calculator.calculateCoilDimensions(30, config, 0.8, 800);
      
      expect(coilDims.statorInnerDiameter).toBeLessThan(coilDims.statorOuterDiameter);
      expect(coilDims.turnsPerCoil).toBeGreaterThan(0);
      expect(coilDims.maxTurnsPerCoil).toBeGreaterThanOrEqual(coilDims.turnsPerCoil);
    });

    it('should adjust turns based on wire diameter', () => {
      const config = { slots: 12, poles: 14, winding: 'distributed' };
      const coilDims1 = calculator.calculateCoilDimensions(30, config, 0.5, 800);
      const coilDims2 = calculator.calculateCoilDimensions(30, config, 1.0, 800);
      
      // Thinner wire should allow more turns
      expect(coilDims1.maxTurnsPerCoil).toBeGreaterThan(coilDims2.maxTurnsPerCoil);
    });
  });

  describe('calculateMagnetParameters', () => {
    it('should calculate proper magnet dimensions', () => {
      const magnetParams = calculator.calculateMagnetParameters(30, 14, 10, 15);
      
      expect(magnetParams.arcLength).toBeGreaterThan(0);
      expect(magnetParams.magnetWidth).toBeLessThanOrEqual(10); // Should not exceed input width
      expect(magnetParams.magnetGap).toBeGreaterThan(0);
    });

    it('should scale arc length with pole count', () => {
      const params1 = calculator.calculateMagnetParameters(30, 10, 10, 15);
      const params2 = calculator.calculateMagnetParameters(30, 20, 10, 15);
      
      // Arc length should be roughly inverse to pole count
      expect(params1.arcLength).toBeGreaterThan(params2.arcLength);
    });
  });

  describe('calculateAirgap', () => {
    it('should increase airgap for larger motors', () => {
      const smallAirgap = calculator.calculateAirgap(20);
      const largeAirgap = calculator.calculateAirgap(100);
      
      expect(largeAirgap).toBeGreaterThan(smallAirgap);
    });
  });

  describe('calculateKV', () => {
    it('should calculate reasonable KV values', () => {
      const kv = calculator.calculateKV(14, 10, 12);
      
      expect(kv).toBeGreaterThan(0);
    });

    it('should decrease KV with more pole count', () => {
      const kv1 = calculator.calculateKV(10, 10, 12);
      const kv2 = calculator.calculateKV(20, 10, 12);
      
      expect(kv1).toBeGreaterThan(kv2);
    });

    it('should decrease KV with more turns', () => {
      const kv1 = calculator.calculateKV(14, 5, 12);
      const kv2 = calculator.calculateKV(14, 10, 12);
      
      expect(kv1).toBeGreaterThan(kv2);
    });
  });

  describe('calculateEfficiency', () => {
    it('should calculate efficiency between 0 and 1', () => {
      const efficiency = calculator.calculateEfficiency({
        poleCount: 14,
        lcm: 84,
        turnsPerCoil: 10,
        maxTurnsPerCoil: 20
      });
      
      expect(efficiency).toBeGreaterThan(0);
      expect(efficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateMotorDesign', () => {
    it('should produce a complete motor design', () => {
      const params = {
        wireThickness: 0.8,
        magnetWidth: 10,
        magnetHeight: 15,
        magnetThickness: 3,
        minDiameter: 30,
        maxDiameter: 40,
        targetKV: 800
      };
      
      const design = calculator.calculateMotorDesign(params);
      
      // Check that all expected properties exist
      expect(design).toHaveProperty('motorDiameter');
      expect(design).toHaveProperty('slotCount');
      expect(design).toHaveProperty('poleCount');
      expect(design).toHaveProperty('turnsPerCoil');
      expect(design).toHaveProperty('estimatedKV');
      expect(design).toHaveProperty('efficiency');
      
      // Check for reasonable values
      expect(design.motorDiameter).toBeGreaterThanOrEqual(params.minDiameter);
      expect(design.motorDiameter).toBeLessThanOrEqual(params.maxDiameter);
      expect(design.estimatedKV).toBeGreaterThan(0);
      expect(design.estimatedKV).toBeLessThan(3000); // Reasonable upper limit
    });

    it('should produce designs with KV close to target', () => {
      const params = {
        wireThickness: 0.8,
        magnetWidth: 10,
        magnetHeight: 15,
        magnetThickness: 3,
        minDiameter: 30,
        maxDiameter: 40,
        targetKV: 800
      };
      
      const design = calculator.calculateMotorDesign(params);
      
      // KV should be somewhat close to target (within 30%)
      expect(Math.abs(design.estimatedKV - params.targetKV) / params.targetKV).toBeLessThan(0.3);
    });
  });
});
