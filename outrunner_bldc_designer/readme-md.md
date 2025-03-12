# Outrunner BLDC Motor Designer

A web-based tool for designing outrunner brushless DC motors. This application helps calculate optimal motor parameters based on your design constraints and generates 2D visualizations of the motor layout.

## Features

- Calculate essential motor parameters:
  - Number of coil turns
  - Coil configurations
  - Magnet arrangement
  - Inner and outer diameter specifications
- Generate 2D visualizations of motor designs
- Export designs as SVG
- Interactive parameter adjustment
- Real-time feedback on design feasibility

## Usage

1. Open `index.html` in your browser
2. Enter your design constraints:
   - Wire thickness (AWG or mm)
   - Magnet dimensions (width, height, thickness)
   - Target motor diameter range
3. Click "Calculate" to generate the optimal motor parameters
4. View the 2D visualization and parameter recommendations
5. Adjust parameters as needed for your specific application
6. Export the design as SVG if desired

## Technical Details

This application uses electromagnetic and mechanical engineering principles to calculate optimal BLDC motor parameters. The main calculation model considers:

- Electromagnetic relationships between current, coil turns, and field strength
- Mechanical constraints of the physical layout
- Heat dissipation requirements
- Torque-to-weight optimization

## Project Structure

```
outrunner-bldc-designer/
├── index.html               # Main application page
├── js/
│   ├── motor-calculator.js  # Core calculation engine
│   ├── motor-visualizer.js  # 2D visualization logic
│   └── app.js              # Application controller
├── css/
│   └── styles.css          # Application styling
├── examples/               # Example motor designs
└── README.md               # This readme file
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
