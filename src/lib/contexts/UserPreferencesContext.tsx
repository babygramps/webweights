'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export type WeightUnit = 'kg' | 'lbs';

interface UserPreferences {
  weightUnit: WeightUnit;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  weightUnit: WeightUnit;
  updateWeightUnit: (unit: WeightUnit) => Promise<void>;
  convertWeight: (weight: number, toUnit?: WeightUnit) => number;
  formatWeight: (weight: number) => string;
  loading: boolean;
}

const defaultPreferences: UserPreferences = {
  weightUnit: 'kg',
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
          .select('weight_unit')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setPreferences({
            weightUnit: data.weight_unit as WeightUnit,
          });
        } else if (error?.code === 'PGRST116') {
          // No preferences exist yet, create them with defaults
          const { data: newPrefs } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              weight_unit: 'kg',
            })
            .select()
            .single();

          if (newPrefs) {
            setPreferences({
              weightUnit: newPrefs.weight_unit as WeightUnit,
            });
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
      } else {
        fetchUserAndPreferences();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    updateWeightUnit,
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
