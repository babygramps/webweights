'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import {
  calculate1RM,
  calculateAverage1RM,
  oneRMFormulas,
  calculatePercentage1RM,
  estimateRepsAt1RMPercentage,
} from '@/lib/utils/1rm-calculator';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';

const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];

export function OneRMCalculator() {
  const { weightUnit } = useUserPreferences();
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [results, setResults] = useState<{ formula: string; value: number }[]>(
    [],
  );
  const [average, setAverage] = useState<number>(0);

  const handleCalculate = () => {
    console.log('[OneRMCalculator] Calculating 1RM');

    const w = parseFloat(weight);
    const r = parseInt(reps);

    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) {
      console.warn('[OneRMCalculator] Invalid input');
      return;
    }

    const formulaResults = oneRMFormulas.map((formula) => ({
      formula: formula.name,
      value: calculate1RM(w, r, formula),
    }));

    const avg = calculateAverage1RM(w, r);

    setResults(formulaResults);
    setAverage(avg);

    console.log('[OneRMCalculator] Results calculated:', formulaResults);
  };

  const handleClear = () => {
    setWeight('');
    setReps('');
    setResults([]);
    setAverage(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          1RM Calculator
        </CardTitle>
        <CardDescription>
          Estimate your one-rep max using various formulas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight ({weightUnit})</Label>
            <Input
              id="weight"
              type="number"
              placeholder={weightUnit === 'kg' ? '100' : '225'}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reps">Reps</Label>
            <Input
              id="reps"
              type="number"
              placeholder="5"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCalculate} className="flex-1">
            Calculate
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Formula Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {results.map((result) => (
                  <div
                    key={result.formula}
                    className="p-3 bg-secondary rounded-lg text-center"
                  >
                    <p className="text-xs text-muted-foreground">
                      {result.formula}
                    </p>
                    <p className="text-lg font-semibold">
                      {result.value} {weightUnit}
                    </p>
                  </div>
                ))}
                <div className="p-3 bg-primary/10 rounded-lg text-center border-2 border-primary">
                  <p className="text-xs font-medium">Average</p>
                  <p className="text-lg font-bold">
                    {average} {weightUnit}
                  </p>
                </div>
              </div>
            </div>

            {/* Percentage Table */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Training Percentages</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left">%1RM</th>
                      <th className="px-3 py-2 text-center">Weight</th>
                      <th className="px-3 py-2 text-center">Est. Reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {percentages.map((pct) => (
                      <tr key={pct} className="border-t">
                        <td className="px-3 py-2 font-medium">{pct}%</td>
                        <td className="px-3 py-2 text-center">
                          {calculatePercentage1RM(average, pct)} {weightUnit}
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">
                          ~{estimateRepsAt1RMPercentage(pct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
