# AI Coach Integration

## Overview

The AI Coach is a sophisticated personal training assistant integrated into the weightlifting app. It provides personalized advice, program generation, exercise recommendations, and progress analysis using OpenAI's GPT models.

## Features

### 1. **Chat Interface**

- Natural language conversation with your AI coach
- Context-aware responses based on your training data
- Streaming responses for real-time interaction
- Mobile-optimized interface with fullscreen support

### 2. **Contextual Quick Actions**

- Smart suggestions based on current page
- One-tap actions for common tasks
- Dynamic updates based on your activity

### 3. **Training Analysis**

- Mesocycle progress evaluation
- Recovery recommendations
- Form and technique advice
- Performance trend analysis

### 4. **Program Generation**

- AI-generated mesocycles based on goals
- Exercise selection and substitution
- Intensity adjustments based on progress
- Periodization recommendations

## Setup

### 1. Environment Variables

Add the following to your `.env.local`:

```env
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional (with defaults)
AI_MODEL=gpt-4-turbo-preview
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

### 2. Database Migration

Run the migration to create AI coach tables:

```bash
pnpm db:push
```

## Architecture

### Components Structure

```
src/components/ai-coach/
├── CoachProvider.tsx       # Context provider for page tracking
├── CoachButton.tsx         # Floating action button
├── CoachChat/
│   ├── ChatInterface.tsx   # Main chat container
│   ├── MessageList.tsx     # Message display
│   ├── MessageInput.tsx    # User input handling
│   ├── QuickActions.tsx    # Contextual actions
│   └── TypingIndicator.tsx # Loading state
```

### State Management

The AI coach uses Zustand for state management with persistence:

```typescript
// Access the store
import { useAICoachStore } from '@/lib/stores/ai-coach-store';

const { openCoach, sendMessage, messages, isLoading } = useAICoachStore();
```

### API Endpoints

- `POST /api/ai-coach/chat` - Main chat endpoint with streaming
- `POST /api/ai-coach/analyze-mesocycle` - Analyze training progress
- `POST /api/ai-coach/suggest-exercises` - Get exercise recommendations
- `POST /api/ai-coach/sessions/end` - Close coaching session

## Usage Examples

### Basic Chat Interaction

```typescript
// Open the coach
const { openCoach } = useAICoachStore();
openCoach('chat');

// Send a message
const { sendMessage } = useAICoachStore();
await sendMessage('What exercises should I do for chest today?');
```

### Mesocycle Analysis

```typescript
import { useMesocycleAnalysis } from '@/lib/hooks/useAICoach';

const { data: analysis } = useMesocycleAnalysis(mesocycleId);
// Returns progress score, recommendations, etc.
```

### Exercise Suggestions

```typescript
import { useExerciseSuggestions } from '@/lib/hooks/useAICoach';

const { data: suggestions } = useExerciseSuggestions({
  muscleGroups: ['chest', 'triceps'],
  equipment: ['barbell', 'dumbbell'],
  goals: ['strength'],
});
```

## Security & Privacy

### Data Protection

- User data is filtered before sending to AI
- No PII is included in prompts
- Session data is stored securely with RLS

### Rate Limiting

- Configurable request limits per user
- Prevents API abuse
- Graceful degradation on limit reached

### Input Sanitization

- All user inputs are sanitized
- Prompt injection protection
- Context validation

## Customization

### Extending Quick Actions

Add new quick actions in `QuickActions.tsx`:

```typescript
const customAction = {
  id: 'custom-action',
  label: 'Custom Action',
  icon: <CustomIcon />,
  action: () => sendMessage('Custom prompt'),
  category: 'training'
};
```

### Custom Prompts

Modify system prompts in `context-builder.ts`:

```typescript
const customPrompt = `
You are a specialized coach for ${userGoal}.
Focus on ${specificArea}.
`;
```

### Styling

The AI coach uses Tailwind CSS and follows the app's design system:

```typescript
// Customize appearance
<ChatInterface
  className="custom-styles"
  isFullscreen={true}
/>
```

## Best Practices

1. **Context Management**

   - Keep context focused and relevant
   - Update context based on user navigation
   - Clear old sessions periodically

2. **Performance**

   - Use streaming for long responses
   - Cache analysis results appropriately
   - Debounce rapid requests

3. **User Experience**

   - Provide immediate feedback
   - Show loading states clearly
   - Handle errors gracefully

4. **Cost Management**
   - Monitor token usage
   - Implement user quotas if needed
   - Use appropriate model for each task

## Troubleshooting

### Common Issues

1. **No response from AI**

   - Check OPENAI_API_KEY is set
   - Verify API quota/billing
   - Check network connectivity

2. **Slow responses**

   - Consider using a faster model
   - Reduce max tokens
   - Check for rate limiting

3. **Context errors**
   - Verify database queries
   - Check user permissions
   - Review error logs

### Debug Mode

Enable debug logging:

```typescript
// In development
console.log('AI Context:', context);
console.log('AI Response:', response);
```

## Future Enhancements

- Voice input/output support
- Image analysis for form checking
- Integration with wearables
- Multi-language support
- Offline mode with local models
- Advanced visualizations
- Social features (coach sharing)
