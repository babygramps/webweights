export interface Database {
  public: {
    Tables: {
      // ... existing tables ...
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          weight_unit: 'kg' | 'lbs';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight_unit?: 'kg' | 'lbs';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weight_unit?: 'kg' | 'lbs';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
