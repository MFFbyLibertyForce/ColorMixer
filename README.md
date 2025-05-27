# Smart Color Mixer

[Try it Live](https://nametakenk.github.io/ColorMixer/)

Smart Color Mixer is a web-based application that helps users combine multiple base colors to approximate a target color.  
The tool uses a Beam Search algorithm for efficient and accurate color mixing, allowing real-time feedback and adjustable options.

---

## Features

- Supports RGB, CMY, WB, and custom colors
- Accepts target color input in HEX (#RRGGBB) or RGB (255,255,255)
- Adjustable step sizes: 1, 3, 5, 7, 10
- Displays mix ratios and per-step quotients
- Fast optimization using Beam Search
- Allows saving, editing, and deleting named mix combinations
- Visual progress indicator during calculation
- LocalStorage-based persistence (no backend required)

---

## How to Use

1. Open the app at [https://nametakenk.github.io/ColorMixer/](https://nametakenk.github.io/ColorMixer/)
2. Add or edit preset/custom colors
3. Enter your desired target color
4. Select a step size and click "Get Mix"
5. View the results including closest match, similarity percentage, and weight distribution
6. Save the mix with a custom name if desired

---

## Technology Stack

- HTML, CSS, JavaScript (Vanilla)
- TheColorAPI (for optional color name lookup)
- Beam Search algorithm
- Browser LocalStorage for saved data

---

## License

MIT License  
Copyright 2024  
[nametakenk](https://github.com/nametakenk)
