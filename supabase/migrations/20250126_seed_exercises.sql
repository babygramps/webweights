-- Seed initial exercise data
INSERT INTO public.exercises (name, type, primary_muscle, tags, is_public, owner_id)
VALUES
  -- Barbell exercises
  ('Barbell Bench Press', 'barbell', 'chest', '["compound", "push", "horizontal"]', true, NULL),
  ('Barbell Back Squat', 'barbell', 'quads', '["compound", "legs", "squat"]', true, NULL),
  ('Conventional Deadlift', 'barbell', 'glutes', '["compound", "pull", "hip-hinge"]', true, NULL),
  ('Barbell Row', 'barbell', 'back', '["compound", "pull", "horizontal"]', true, NULL),
  ('Overhead Press', 'barbell', 'shoulders', '["compound", "push", "vertical"]', true, NULL),
  ('Romanian Deadlift', 'barbell', 'hamstrings', '["compound", "pull", "hip-hinge"]', true, NULL),
  ('Front Squat', 'barbell', 'quads', '["compound", "legs", "squat"]', true, NULL),
  ('Incline Barbell Press', 'barbell', 'chest', '["compound", "push", "incline"]', true, NULL),
  ('Barbell Curl', 'barbell', 'biceps', '["isolation", "pull", "arms"]', true, NULL),
  ('Close-Grip Bench Press', 'barbell', 'triceps', '["compound", "push", "arms"]', true, NULL),
  
  -- Dumbbell exercises
  ('Dumbbell Bench Press', 'dumbbell', 'chest', '["compound", "push", "horizontal"]', true, NULL),
  ('Dumbbell Row', 'dumbbell', 'back', '["compound", "pull", "horizontal"]', true, NULL),
  ('Dumbbell Shoulder Press', 'dumbbell', 'shoulders', '["compound", "push", "vertical"]', true, NULL),
  ('Bulgarian Split Squat', 'dumbbell', 'quads', '["unilateral", "legs", "squat"]', true, NULL),
  ('Dumbbell Lateral Raise', 'dumbbell', 'shoulders', '["isolation", "shoulders", "lateral"]', true, NULL),
  ('Dumbbell Flyes', 'dumbbell', 'chest', '["isolation", "push", "chest"]', true, NULL),
  ('Hammer Curl', 'dumbbell', 'biceps', '["isolation", "pull", "arms"]', true, NULL),
  
  -- Machine exercises
  ('Lat Pulldown', 'machine', 'back', '["compound", "pull", "vertical"]', true, NULL),
  ('Cable Row', 'machine', 'back', '["compound", "pull", "horizontal"]', true, NULL),
  ('Leg Press', 'machine', 'quads', '["compound", "legs", "press"]', true, NULL),
  ('Leg Curl', 'machine', 'hamstrings', '["isolation", "legs", "hamstrings"]', true, NULL),
  ('Leg Extension', 'machine', 'quads', '["isolation", "legs", "quads"]', true, NULL),
  ('Cable Chest Fly', 'machine', 'chest', '["isolation", "push", "chest"]', true, NULL),
  ('Cable Lateral Raise', 'machine', 'shoulders', '["isolation", "shoulders", "lateral"]', true, NULL),
  ('Cable Tricep Pushdown', 'machine', 'triceps', '["isolation", "push", "arms"]', true, NULL),
  ('Cable Bicep Curl', 'machine', 'biceps', '["isolation", "pull", "arms"]', true, NULL),
  
  -- Bodyweight exercises
  ('Pull-Up', 'bodyweight', 'back', '["compound", "pull", "vertical"]', true, NULL),
  ('Push-Up', 'bodyweight', 'chest', '["compound", "push", "horizontal"]', true, NULL),
  ('Dips', 'bodyweight', 'chest', '["compound", "push", "vertical"]', true, NULL),
  ('Walking Lunge', 'bodyweight', 'quads', '["unilateral", "legs", "functional"]', true, NULL),
  
  -- Additional exercises
  ('Calf Raise', 'barbell', 'calves', '["isolation", "legs", "calves"]', true, NULL),
  ('Face Pull', 'machine', 'shoulders', '["isolation", "pull", "rear-delts"]', true, NULL),
  ('Hip Thrust', 'barbell', 'glutes', '["compound", "glutes", "hip-hinge"]', true, NULL),
  ('Preacher Curl', 'barbell', 'biceps', '["isolation", "pull", "arms"]', true, NULL),
  ('Skull Crusher', 'barbell', 'triceps', '["isolation", "push", "arms"]', true, NULL),
  ('T-Bar Row', 'barbell', 'back', '["compound", "pull", "horizontal"]', true, NULL),
  ('Hack Squat', 'machine', 'quads', '["compound", "legs", "squat"]', true, NULL),
  ('Good Morning', 'barbell', 'hamstrings', '["compound", "hip-hinge", "posterior-chain"]', true, NULL),
  ('Upright Row', 'barbell', 'shoulders', '["compound", "pull", "shoulders"]', true, NULL),
  ('Shrugs', 'barbell', 'traps', '["isolation", "pull", "traps"]', true, NULL)
ON CONFLICT DO NOTHING; 