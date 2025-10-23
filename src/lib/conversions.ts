export const unitCategories = {
  Length: {
    Meter: 1,
    Kilometer: 1000,
    Centimeter: 0.01,
    Millimeter: 0.001,
    Mile: 1609.34,
    Yard: 0.9144,
    Foot: 0.3048,
    Inch: 0.0254,
  },
  Mass: {
    Kilogram: 1,
    Gram: 0.001,
    Milligram: 0.000001,
    Pound: 0.453592,
    Ounce: 0.0283495,
  },
  Temperature: {
    Celsius: 'celsius',
    Fahrenheit: 'fahrenheit',
    Kelvin: 'kelvin',
  },
  Time: {
    Second: 1,
    Minute: 60,
    Hour: 3600,
    Day: 86400,
    Week: 604800,
  },
  Area: {
    'Square Meter': 1,
    'Square Kilometer': 1000000,
    'Square Mile': 2590000,
    'Square Yard': 0.836127,
    'Square Foot': 0.092903,
  },
  Volume: {
    'Cubic Meter': 1000,
    Liter: 1,
    Milliliter: 0.001,
    Gallon: 3.78541,
    Quart: 0.946353,
  },
};

export function convertUnits(value: number, fromUnit: string, toUnit: string, category: string): string {
  if (isNaN(value)) return '';

  const categoryUnits = unitCategories[category as keyof typeof unitCategories];

  if (category === 'Temperature') {
    let tempInCelsius: number;
    switch (fromUnit) {
      case 'Fahrenheit':
        tempInCelsius = (value - 32) * 5 / 9;
        break;
      case 'Kelvin':
        tempInCelsius = value - 273.15;
        break;
      default: // Celsius
        tempInCelsius = value;
    }

    let result: number;
    switch (toUnit) {
      case 'Fahrenheit':
        result = (tempInCelsius * 9 / 5) + 32;
        break;
      case 'Kelvin':
        result = tempInCelsius + 273.15;
        break;
      default: // Celsius
        result = tempInCelsius;
    }
    return result.toFixed(2);
  }

  const fromFactor = categoryUnits[fromUnit as keyof typeof categoryUnits] as number;
  const toFactor = categoryUnits[toUnit as keyof typeof categoryUnits] as number;
  
  const result = value * fromFactor / toFactor;

  return parseFloat(result.toPrecision(10)).toString();
}
