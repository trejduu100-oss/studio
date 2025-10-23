"use client";

import { useReducer, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Sigma, Ruler, Delete, Undo2, Equal, Pipette } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { unitCategories, convertUnits } from '@/lib/conversions';
import { functions } from '@/lib/functions';
import { useToast } from "@/hooks/use-toast"

type State = {
  expression: string;
};

type Action =
  | { type: 'APPEND'; payload: string }
  | { type: 'CLEAR' }
  | { type: 'BACKSPACE' }
  | { type: 'SET_EXPRESSION'; payload: string };

const initialState: State = {
  expression: '',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'APPEND':
      if (state.expression === 'Error') {
        return { expression: action.payload };
      }
      return { expression: state.expression + action.payload };
    case 'CLEAR':
      return { expression: '' };
    case 'BACKSPACE':
      if (state.expression === 'Error') return { expression: '' };
      return { expression: state.expression.slice(0, -1) };
    case 'SET_EXPRESSION':
      return { expression: action.payload };
    default:
      return state;
  }
}

function evaluateExpression(expr: string): string {
    if (!expr) return "0";
    try {
        let evalFriendlyExpr = expr
            .replace(/\^/g, '**')
            .replace(/√/g, 'Math.sqrt')
            .replace(/π/g, 'Math.PI')
            .replace(/E/g, 'Math.E')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/log/g, 'Math.log10')
            .replace(/ln/g, 'Math.log')
            .replace(/%/g, '/100');

        const result = new Function('return ' + evalFriendlyExpr)();
        if (typeof result !== 'number' || !isFinite(result)) {
            return "Error";
        }

        return String(parseFloat(result.toPrecision(14)));
    } catch (error) {
        return "Error";
    }
}

const HistoryPanel = ({ history, onSelect, onClear }: { history: { expression: string; result: string }[], onSelect: (value: string) => void, onClear: () => void }) => (
  <div className="p-4 h-full flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-lg">History</h3>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={history.length === 0}>Clear</Button>
    </div>
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2">
        {history.length > 0 ? history.map((item, index) => (
          <div key={index} className="p-2 rounded-md hover:bg-accent/50 text-right">
            <button onClick={() => onSelect(item.expression)} className="w-full text-right text-muted-foreground text-sm truncate">{item.expression}</button>
            <button onClick={() => onSelect(item.result)} className="w-full text-right text-xl font-semibold truncate">{item.result}</button>
          </div>
        )) : <p className="text-muted-foreground text-center pt-10">No history yet.</p>}
      </div>
    </ScrollArea>
  </div>
);

const FunctionsPanel = ({ onSelect }: { onSelect: (value: string) => void }) => (
  <div className="p-4">
    <h3 className="font-semibold text-lg mb-4">Functions</h3>
    <div className="grid grid-cols-3 gap-2">
      {functions.map(func => (
        <Button key={func.name} variant="secondary" className="h-12 text-lg" onClick={() => onSelect(func.value)}>
          {func.name}
        </Button>
      ))}
    </div>
  </div>
);

const UnitConverter = () => {
    const [category, setCategory] = useState(Object.keys(unitCategories)[0]);
    const units = Object.keys(unitCategories[category as keyof typeof unitCategories]);
    const [fromUnit, setFromUnit] = useState(units[0]);
    const [toUnit, setToUnit] = useState(units[1] || units[0]);
    const [inputValue, setInputValue] = useState('1');
    const [outputValue, setOutputValue] = useState('');

    const handleConvert = () => {
        const result = convertUnits(parseFloat(inputValue), fromUnit, toUnit, category);
        setOutputValue(result);
    };

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory);
        const newUnits = Object.keys(unitCategories[newCategory as keyof typeof unitCategories]);
        setFromUnit(newUnits[0]);
        setToUnit(newUnits[1] || newUnits[0]);
        setInputValue('1');
        setOutputValue('');
    };
    
    // biome-ignore lint/correctness/useExhaustiveDependencies: handleConvert should be triggered on state changes
    useState(() => {
        handleConvert();
    });

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Unit Converter</h3>
      <Select value={category} onValueChange={handleCategoryChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.keys(unitCategories).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex items-center space-x-2">
        <div className="w-1/2 space-y-1">
          <Input type="number" value={inputValue} onChange={e => setInputValue(e.target.value)} />
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {units.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/2 space-y-1">
          <Input type="text" value={outputValue} readOnly className="font-semibold" />
           <Select value={toUnit} onValueChange={setToUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {units.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleConvert} className="w-full">Convert</Button>
    </div>
  );
};


export function CalculatorApp() {
  const [{ expression }, dispatch] = useReducer(reducer, initialState);
  const [history, setHistory] = useState<{ expression: string; result: string }[]>([]);
  const [lastAnswer, setLastAnswer] = useState('');
  const { toast } = useToast();

  const handleCalculate = () => {
    if (expression === '' || expression === 'Error') return;
    const result = evaluateExpression(expression);
    if(result === "Error") {
        toast({
            title: "Invalid Expression",
            description: "Please check your calculation.",
            variant: "destructive",
        })
    }
    setHistory(prev => [{ expression, result }, ...prev].slice(0, 50));
    setLastAnswer(result);
    dispatch({ type: 'SET_EXPRESSION', payload: result });
  };
  
  const buttons = [
    { label: '(', action: () => dispatch({ type: 'APPEND', payload: '(' }) },
    { label: ')', action: () => dispatch({ type: 'APPEND', payload: ')' }) },
    { label: <Undo2 />, action: () => dispatch({ type: 'APPEND', payload: lastAnswer }) },
    { label: <Delete />, action: () => dispatch({ type: 'BACKSPACE' }) },
    { label: '7', action: () => dispatch({ type: 'APPEND', payload: '7' }) },
    { label: '8', action: () => dispatch({ type: 'APPEND', payload: '8' }) },
    { label: '9', action: () => dispatch({ type: 'APPEND', payload: '9' }) },
    { label: '/', action: () => dispatch({ type: 'APPEND', payload: '/' }) },
    { label: '4', action: () => dispatch({ type: 'APPEND', payload: '4' }) },
    { label: '5', action: () => dispatch({ type: 'APPEND', payload: '5' }) },
    { label: '6', action: () => dispatch({ type: 'APPEND', payload: '6' }) },
    { label: '*', action: () => dispatch({ type: 'APPEND', payload: '*' }) },
    { label: '1', action: () => dispatch({ type: 'APPEND', payload: '1' }) },
    { label: '2', action: () => dispatch({ type: 'APPEND', payload: '2' }) },
    { label: '3', action: () => dispatch({ type: 'APPEND', payload: '3' }) },
    { label: '-', action: () => dispatch({ type: 'APPEND', payload: '-' }) },
    { label: '0', action: () => dispatch({ type: 'APPEND', payload: '0' }) },
    { label: '.', action: () => dispatch({ type: 'APPEND', payload: '.' }) },
    { label: <Equal />, action: handleCalculate },
    { label: '+', action: () => dispatch({ type: 'APPEND', payload: '+' }) },
  ];

  return (
    <Card className="w-full max-w-4xl shadow-2xl overflow-hidden bg-background border-0">
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 p-4 md:p-6 flex flex-col">
          <div className="bg-transparent rounded-lg p-4 text-right h-28 mb-4 flex flex-col justify-end">
            <p className="text-5xl md:text-6xl font-mono break-all font-light" aria-live="polite">{expression || '0'}</p>
          </div>
          <div className="grid grid-cols-4 gap-2 flex-1">
            {buttons.map((btn, i) => {
              const isNumber = typeof btn.label === 'string' && '0123456789.'.includes(btn.label);
              const isOperator = typeof btn.label === 'string' && '/*-+'.includes(btn.label);
              const isEqual = typeof btn.label !== 'string'; // A bit of a hack for the Equal component

              return (
                <Button
                  key={i}
                  variant={isNumber ? 'secondary' : 'default'}
                  className={`h-full text-2xl active:scale-95 transition-transform rounded-full aspect-square
                    ${isEqual ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                    ${isOperator ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                    ${!isNumber && !isOperator && !isEqual ? 'bg-accent text-accent-foreground hover:bg-accent/80' : ''}
                  `}
                  onClick={btn.action}
                >
                  {btn.label}
                </Button>
              )
            })}
             <Button
                variant={'secondary'}
                className="h-full text-2xl active:scale-95 transition-transform rounded-full col-span-4"
                onClick={() => dispatch({ type: 'CLEAR' })}
              >
                Clear
              </Button>
          </div>
        </div>
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-muted/20">
          <Tabs defaultValue="history" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                <TabsTrigger value="history" className="h-12 rounded-none"><History className="size-5" /></TabsTrigger>
                <TabsTrigger value="functions" className="h-12 rounded-none"><Sigma className="size-5" /></TabsTrigger>
                <TabsTrigger value="converter" className="h-12 rounded-none"><Ruler className="size-5" /></TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="flex-1">
                <HistoryPanel history={history} onSelect={(val) => dispatch({ type: 'SET_EXPRESSION', payload: val})} onClear={() => setHistory([])} />
            </TabsContent>
            <TabsContent value="functions" className="flex-1">
                <FunctionsPanel onSelect={(val) => dispatch({ type: 'APPEND', payload: val })} />
            </TabsContent>
            <TabsContent value="converter" className="flex-1">
                <UnitConverter />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  );
}
