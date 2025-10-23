"use client";

import { useReducer, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Sigma, Ruler, Delete, Undo2, Equal, Sparkles, Bot, Camera, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { unitCategories, convertUnits } from '@/lib/conversions';
import { functions } from '@/lib/functions';
import { useToast } from "@/hooks/use-toast";
import { explainCalculation } from '@/ai/flows/calculator-assistant-flow';
import type { ExplainCalculationOutput } from '@/ai/flows/calculator-assistant-types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
    useEffect(() => {
        handleConvert();
    }, [inputValue, fromUnit, toUnit, category]);

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

const AssistantPanel = ({ expression }: { expression: string }) => {
  const [explanation, setExplanation] = useState<ExplainCalculationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExplain = async (photoDataUri?: string) => {
    if ((!expression || expression === 'Error' || expression === '0') && !photoDataUri) {
      toast({
        title: "Nothing to explain",
        description: "Enter a calculation or take a photo to get an explanation.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    setExplanation(null);
    try {
      const result = await explainCalculation({ expression, photoDataUri });
      setExplanation(result);
    } catch (e) {
      toast({
        title: "AI Assistant Error",
        description: "Could not get an explanation.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="font-semibold text-lg mb-4">AI Assistant</h3>
      <div className="flex-1 space-y-4">
        <Button onClick={() => handleExplain()} disabled={isLoading} className="w-full">
          {isLoading ? 'Thinking...' : <> <Sparkles className="mr-2 size-4" /> Explain Calculation</>}
        </Button>
        <ScrollArea className="h-96">
          {explanation && (
            <Card className="p-4 bg-background">
              <CardContent className="p-0 space-y-4">
                 <p className="text-sm text-foreground whitespace-pre-wrap font-mono">{explanation.explanation}</p>
                 <p className="text-lg font-bold text-primary">Result: {explanation.result}</p>
              </CardContent>
            </Card>
          )}
           {isLoading && (
            <div className="flex items-center justify-center pt-10">
              <Bot className="size-8 animate-bounce" />
            </div>
           )}
           {!isLoading && !explanation && (
             <p className="text-muted-foreground text-center pt-10">
               Enter a calculation and click "Explain Calculation" to see a step-by-step breakdown.
            </p>
           )}
        </ScrollArea>
      </div>
    </div>
  );
};

const PhotoMathPanel = ({ onExpressionChange }: { onExpressionChange: (expression: string) => void }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplainCalculationOutput | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (hasCameraPermission) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();
  }, [hasCameraPermission, toast]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUri = canvas.toDataURL('image/png');
      setCapturedImage(dataUri);
    }
  };

  const handleExplainPhoto = async () => {
    if (!capturedImage) return;
    setIsLoading(true);
    setExplanation(null);
    try {
      const result = await explainCalculation({ expression: '', photoDataUri: capturedImage });
      setExplanation(result);
      if (result.result !== 'Error') {
        onExpressionChange(result.result);
      }
    } catch (e) {
      toast({
        title: "AI Assistant Error",
        description: "Could not analyze the photo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const reset = () => {
    setCapturedImage(null);
    setExplanation(null);
    onExpressionChange('');
  }

  return (
    <div className="p-4 h-full flex flex-col space-y-4">
      <h3 className="font-semibold text-lg">Photo Math</h3>
      
      <div className="relative aspect-video rounded-md overflow-hidden bg-zinc-800 flex items-center justify-center">
        <video ref={videoRef} className={`w-full h-full object-cover ${capturedImage ? 'hidden' : ''}`} autoPlay playsInline muted />
        {capturedImage && (
            <img src={capturedImage} alt="Captured math problem" className="w-full h-full object-contain" />
        )}
        <canvas ref={canvasRef} className="hidden" />
        {hasCameraPermission === false && (
            <Alert variant="destructive" className="m-4">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                Please allow camera access to use this feature.
                </AlertDescription>
            </Alert>
        )}
      </div>

      <div className="flex gap-2">
        {!capturedImage ? (
            <Button onClick={takePhoto} disabled={!hasCameraPermission || isLoading} className="w-full">
                <Camera className="mr-2 size-4"/>
                Take Photo
            </Button>
        ) : (
            <>
                <Button onClick={reset} disabled={isLoading} variant="secondary" className="w-full">
                    <RefreshCw className="mr-2 size-4"/>
                    Retake
                </Button>
                <Button onClick={handleExplainPhoto} disabled={isLoading} className="w-full">
                    {isLoading ? 'Thinking...' : <> <Sparkles className="mr-2 size-4" /> Explain</>}
                </Button>
            </>
        )}
      </div>

      <ScrollArea className="flex-1">
          {explanation && (
            <Card className="p-4 bg-background">
              <CardContent className="p-0 space-y-4">
                 <p className="text-sm text-foreground whitespace-pre-wrap font-mono">{explanation.explanation}</p>
                 <p className="text-lg font-bold text-primary">Result: {explanation.result}</p>
              </CardContent>
            </Card>
          )}
           {isLoading && (
            <div className="flex items-center justify-center pt-10">
              <Bot className="size-8 animate-bounce" />
            </div>
           )}
           {!isLoading && !explanation && (
             <p className="text-muted-foreground text-center pt-4">
               {hasCameraPermission ? 'Point your camera at a math problem and take a photo.' : 'Enable camera to get started.'}
            </p>
           )}
      </ScrollArea>
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

  const handleSetExpression = (newExpression: string) => {
    dispatch({ type: 'SET_EXPRESSION', payload: newExpression });
  }
  
  const buttons = [
    { label: '(', action: () => dispatch({ type: 'APPEND', payload: '(' }) },
    { label: ')', action: () => dispatch({ type: 'APPEND', payload: ')' }) },
    { label: 'Ans', action: () => dispatch({ type: 'APPEND', payload: lastAnswer }), className: 'text-primary' },
    { label: <Delete className="text-primary" />, action: () => dispatch({ type: 'BACKSPACE' }) },
    { label: '7', action: () => dispatch({ type: 'APPEND', payload: '7' }) },
    { label: '8', action: () => dispatch({ type: 'APPEND', payload: '8' }) },
    { label: '9', action: () => dispatch({ type: 'APPEND', payload: '9' }) },
    { label: '÷', action: () => dispatch({ type: 'APPEND', payload: '/' }), className: 'bg-primary text-primary-foreground' },
    { label: '4', action: () => dispatch({ type: 'APPEND', payload: '4' }) },
    { label: '5', action: () => dispatch({ type: 'APPEND', payload: '5' }) },
    { label: '6', action: () => dispatch({ type: 'APPEND', payload: '6' }) },
    { label: '×', action: () => dispatch({ type: 'APPEND', payload: '*' }), className: 'bg-primary text-primary-foreground' },
    { label: '1', action: () => dispatch({ type: 'APPEND', payload: '1' }) },
    { label: '2', action: () => dispatch({ type: 'APPEND', payload: '2' }) },
    { label: '3', action: () => dispatch({ type: 'APPEND', payload: '3' }) },
    { label: '−', action: () => dispatch({ type: 'APPEND', payload: '-' }), className: 'bg-primary text-primary-foreground' },
    { label: '0', action: () => dispatch({ type: 'APPEND', payload: '0' }) },
    { label: '.', action: () => dispatch({ type: 'APPEND', payload: '.' }) },
    { label: '=', action: handleCalculate, className: 'bg-primary text-primary-foreground' },
    { label: '+', action: () => dispatch({ type: 'APPEND', payload: '+' }), className: 'bg-primary text-primary-foreground' },
  ];

  return (
    <Card className="w-full max-w-5xl shadow-2xl overflow-hidden bg-zinc-900 border-zinc-800 rounded-3xl">
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 p-4 md:p-6 flex flex-col">
          <div className="bg-transparent rounded-lg p-4 text-right h-32 mb-4 flex flex-col justify-end">
            <p className="text-5xl md:text-6xl font-mono break-all font-light text-zinc-100" aria-live="polite">{expression || '0'}</p>
          </div>
          <div className="grid grid-cols-4 gap-2 flex-1">
            {buttons.map((btn, i) => (
              <Button
                key={i}
                variant={'ghost'}
                className={`h-full text-2xl active:scale-95 transition-transform rounded-full aspect-square text-zinc-100 bg-zinc-700/50 hover:bg-zinc-700 ${btn.className}`}
                onClick={btn.action}
              >
                {btn.label}
              </Button>
            ))}
             <Button
                variant={'ghost'}
                className="h-full text-xl active:scale-95 transition-transform rounded-full col-span-4 bg-zinc-700/50 hover:bg-zinc-700 text-primary"
                onClick={() => dispatch({ type: 'CLEAR' })}
              >
                Clear
              </Button>
          </div>
        </div>
        <div className="w-full md:w-[28rem] border-t md:border-t-0 md:border-l bg-zinc-950/50 border-zinc-800">
          <Tabs defaultValue="history" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 rounded-none border-b bg-transparent p-0 border-zinc-800">
                <TabsTrigger value="history" className="h-14 rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400"><History className="size-5" /></TabsTrigger>
                <TabsTrigger value="functions" className="h-14 rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400"><Sigma className="size-5" /></TabsTrigger>
                <TabsTrigger value="converter" className="h-14 rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400"><Ruler className="size-5" /></TabsTrigger>
                <TabsTrigger value="assistant" className="h-14 rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400"><Sparkles className="size-5" /></TabsTrigger>
                <TabsTrigger value="photo-math" className="h-14 rounded-none data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-400"><Camera className="size-5" /></TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="flex-1 mt-0">
                <HistoryPanel history={history} onSelect={(val) => dispatch({ type: 'SET_EXPRESSION', payload: val})} onClear={() => setHistory([])} />
            </TabsContent>
            <TabsContent value="functions" className="flex-1 mt-0">
                <FunctionsPanel onSelect={(val) => dispatch({ type: 'APPEND', payload: val })} />
            </TabsContent>
            <TabsContent value="converter" className="flex-1 mt-0">
                <UnitConverter />
            </TabsContent>
            <TabsContent value="assistant" className="flex-1 mt-0">
                <AssistantPanel expression={expression} />
            </TabsContent>
            <TabsContent value="photo-math" className="flex-1 mt-0">
                <PhotoMathPanel onExpressionChange={handleSetExpression} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  );
}
