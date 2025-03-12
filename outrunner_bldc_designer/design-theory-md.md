# BLDC Motor Design Theory

This document provides an overview of the theory behind brushless DC (BLDC) motor design, specifically for outrunner configurations. Understanding these principles will help you make better design choices when using the Outrunner BLDC Motor Designer.

## Table of Contents
1. [BLDC Motor Basics](#bldc-motor-basics)
2. [Outrunner vs. Inrunner Configuration](#outrunner-vs-inrunner-configuration)
3. [Key Design Parameters](#key-design-parameters)
4. [Slot-Pole Combinations](#slot-pole-combinations)
5. [Winding Configurations](#winding-configurations)
6. [Magnet Selection](#magnet-selection)
7. [Wire Selection](#wire-selection)
8. [Performance Calculations](#performance-calculations)
9. [Thermal Considerations](#thermal-considerations)
10. [References](#references)

## BLDC Motor Basics

A brushless DC motor consists of several key components:

- **Stator**: The stationary part containing the wire windings
- **Rotor**: The rotating part containing permanent magnets
- **Windings**: Coils of copper wire arranged in slots around the stator
- **Permanent Magnets**: Create the magnetic field that interacts with the windings
- **Controller**: Electronic device that energizes the windings in sequence

BLDC motors operate on the principle of electromagnetic attraction and repulsion. The controller energizes the stator windings in a specific sequence, creating a rotating magnetic field that the permanent magnets on the rotor follow.

## Outrunner vs. Inrunner Configuration

BLDC motors come in two main configurations:

- **Inrunner**: The rotor is inside the stator, resulting in higher RPM and lower torque
- **Outrunner**: The rotor is outside the stator, resulting in lower RPM and higher torque

### Outrunner Advantages:
- Higher torque due to larger lever arm
- Better cooling for the magnets
- More space for magnets, allowing more poles
- Generally more efficient for direct-drive applications

### Outrunner Disadvantages:
- Lower maximum RPM due to centrifugal forces
- Larger diameter for the same power
- More complex mechanical design

## Key Design Parameters

The performance of a BLDC motor is determined by several key parameters:

1. **KV Rating**: The motor's RPM per volt (without load)
2. **Number of Poles**: The number of magnetic poles on the rotor
3. **Number of Slots**: The number of winding slots in the stator
4. **Wire Gauge**: The thickness of the wire used for the windings
5. **Turns per Coil**: The number of times the wire is wrapped around each tooth
6. **Magnet Dimensions**: The size and shape of the permanent magnets
7. **Airgap**: The distance between the stator and rotor

## Slot-Pole Combinations

The selection of slot and pole counts is critical for motor performance:

### Common Combinations:
- 12 slots, 14 poles: Low cogging, good efficiency
- 9 slots, 10 poles: Good balance of performance and simplicity
- 9 slots, 12 poles: Higher torque, possible higher cogging
- 6 slots, 8 poles: Simple construction, higher cogging
- 24 slots, 22 poles: Very low cogging, complex construction

### Selection Criteria:
1. **Least Common Multiple (LCM)**: Higher LCM means lower cogging torque
2. **Winding Factor**: Affects efficiency and torque production
3. **Manufacturing Complexity**: More slots and poles increase complexity

## Winding Configurations

There are two main types of windings:

### Distributed Windings:
- Each phase spans multiple slots
- Smoother torque output
- Lower copper losses
- More complex to wind

### Concentrated Windings:
- Each coil is wound around a single tooth
- Simpler to manufacture
- Higher copper losses
- Potentially higher cogging torque

The correct winding pattern depends on the slot-pole combination. Common patterns include:

- **Single layer**: One coil per slot
- **Double layer**: Two coils per slot
- **Wave winding**: A continuous winding pattern through multiple slots

## Magnet Selection

Permanent magnets are a critical component:

### Magnet Types:
- **Neodymium (NdFeB)**: Highest power, most expensive, temperature sensitive
- **Samarium Cobalt (SmCo)**: Good power, better temperature resistance, expensive
- **Ferrite**: Lower power, inexpensive, good temperature resistance

### Magnet Parameters:
1. **Remanence (Br)**: Strength of the magnetic field (measured in Tesla or Gauss)
2. **Coercivity (Hc)**: Resistance to demagnetization
3. **Temperature Coefficient**: How much magnetic strength is lost per degree of temperature increase
4. **Size and Shape**: Arc magnets match the curvature of the rotor

## Wire Selection

Wire selection affects the motor's resistance, current capacity, and power:

### Wire Gauge:
- Smaller gauge (larger diameter) wire has lower resistance but fewer turns possible
- Larger gauge (smaller diameter) wire allows more turns but has higher resistance

### Fill Factor:
- The percentage of slot area filled with copper
- Higher fill factor improves efficiency
- Typical values range from 40% to 60%

### Insulation:
- Thinner insulation allows more copper in the same space
- Must be rated for the operating temperature

## Performance Calculations

Several key formulas help predict motor performance:

### KV Rating:
```
KV = 1/(2π × Flux × Turns per Phase)
```

Where:
- KV is the motor constant in RPM/V
- Flux is the magnetic flux per pole in Weber
- Turns per phase is the total number of turns in one phase

### Back EMF:
```
Back EMF = KV × RPM / 60
```

### Torque:
```
Torque = 8.3 × Power / (KV × Voltage)
```
Where torque is in Nm and power is in watts.

### Efficiency:
Affected by:
- Copper losses (I²R)
- Iron losses (eddy currents and hysteresis)
- Mechanical losses (friction and windage)

## Thermal Considerations

Heat is a major limiting factor in motor design:

### Heat Sources:
- Copper losses in the windings (I²R)
- Iron losses in the stator laminations
- Friction from bearings

### Cooling Strategies:
- Air cooling (passive or active)
- Thermal conduction through the motor mount
- Integrated cooling channels

### Temperature Limits:
- Magnet demagnetization temperature (depends on magnet type)
- Insulation temperature rating
- Bearing temperature limits

## References

1. Hanselman, D. (2006). Brushless Permanent Magnet Motor Design. Magna Physics.
2. Gieras, J. F. (2010). Permanent Magnet Motor Technology. CRC Press.
3. Hendershot, J. R., & Miller, T. J. E. (2010). Design of Brushless Permanent-Magnet Machines. Motor Design Books LLC.
4. Pyrhonen, J., Jokinen, T., & Hrabovcova, V. (2013). Design of Rotating Electrical Machines. Wiley.
5. Meier, F. (2008). Permanent-Magnet Synchronous Machines with Non-Overlapping Concentrated Windings for Low-Speed Direct-Drive Applications. KTH.
