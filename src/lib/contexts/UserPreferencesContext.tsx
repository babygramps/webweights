'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';

export type WeightUnit = 'kg' | 'lbs';
export type Theme = 'light' | 'dark';

interface UserPreferences {
  weightUnit: WeightUnit;
  theme: Theme;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  weightUnit: WeightUnit;
  theme: Theme;
  updateWeightUnit: (unit: WeightUnit) => Promise<void>;
  updateTheme: (theme: Theme) => Promise<void>;
  convertWeight: (weight: number, toUnit?: WeightUnit) => number;
  formatWeight: (weight: number) => string;
  loading: boolean;
}

const defaultPreferences: UserPreferences = {
  weightUnit: 'kg',
  theme: 'light',
};

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(
  null,
);

export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { setTheme } = useTheme();

  // Fetch user and preferences on mount
  useEffect(() => {
    const fetchUserAndPreferences = async () => {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user preferences
        const { data, error } = await supabase
          .from('user_preferences')
          .select('weight_unit, theme')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setPreferences({
            weightUnit: data.weight_unit as WeightUnit,
            theme: (data.theme as Theme) || 'light',
          });
          setTheme((data.theme as Theme) || 'light');
        } else if (error?.code === 'PGRST116') {
          // No preferences exist yet, create them with defaults
          const { data: newPrefs } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              weight_unit: 'kg',
              theme: 'light',
            })
            .select()
            .single();

          if (newPrefs) {
            setPreferences({
              weightUnit: newPrefs.weight_unit as WeightUnit,
              theme: 'light',
            });
            setTheme('light');
          }
        }
      }

      setLoading(false);
    };

    fetchUserAndPreferences();

    // Subscribe to auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setPreferences(defaultPreferences);
        setTheme('light');
      } else {
        fetchUserAndPreferences();
      }
    });

    return () => subscription.unsubscribe();
  }, [setTheme]);

  const updateWeightUnit = async (unit: WeightUnit) => {
    if (!user) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('user_preferences')
      .update({ weight_unit: unit })
      .eq('user_id', user.id);

    if (!error) {
      setPreferences((prev) => ({ ...prev, weightUnit: unit }));
    } else {
      console.error('Error updating weight unit:', error);
      throw error;
    }
  };

  const updateTheme = async (theme: Theme) => {
    const supabase = createClient();
    if (user) {
      const { error } = await supabase
        .from('user_preferences')
        .update({ theme })
        .eq('user_id', user.id);
      if (error) {
        console.error('Error updating theme:', error);
        throw error;
      }
    }
    setTheme(theme);
    setPreferences((prev) => ({ ...prev, theme }));
  };

  const convertWeight = (weight: number, toUnit?: WeightUnit): number => {
    const targetUnit = toUnit || preferences.weightUnit;

    // If weight is stored in kg (database default) and user wants lbs
    if (targetUnit === 'lbs') {
      return Math.round(weight * 2.20462 * 10) / 10; // Round to 1 decimal
    }

    // If weight is stored in kg and user wants kg (or any other case)
    return weight;
  };

  const formatWeight = (weight: number): string => {
    const converted = convertWeight(weight);
    return `${converted} ${preferences.weightUnit}`;
  };

  const value: UserPreferencesContextType = {
    preferences,
    weightUnit: preferences.weightUnit,
    theme: preferences.theme,
    updateWeightUnit,
    updateTheme,
    convertWeight,
    formatWeight,
    loading,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error(
      'useUserPreferences must be used within UserPreferencesProvider',
    );
  }
  return context;
}
