'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Brain,
  Dumbbell,
  Video,
  BookOpen,
  PenLine,
  Target,
  Sparkles,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

// Form validation schema
const assignmentFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  type: z.enum(['REFLECTION', 'EXERCISE', 'VIDEO_WATCH', 'READING', 'JOURNALING', 'GOAL_SETTING', 'MINDFULNESS']),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  estimatedTime: z.number().min(1).max(300),
  resources: z.string().optional(),
  sportFilter: z.string().optional(),
  yearFilter: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

const ASSIGNMENT_TYPES = [
  {
    value: 'REFLECTION',
    label: 'Reflection',
    description: 'Written reflection questions',
    icon: Brain,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    value: 'EXERCISE',
    label: 'Mental Exercise',
    description: 'Guided breathing, visualization',
    icon: Dumbbell,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    value: 'VIDEO_WATCH',
    label: 'Video',
    description: 'Watch educational video + quiz',
    icon: Video,
    color: 'bg-red-100 text-red-600',
  },
  {
    value: 'READING',
    label: 'Reading',
    description: 'Read article/chapter + summary',
    icon: BookOpen,
    color: 'bg-green-100 text-green-600',
  },
  {
    value: 'JOURNALING',
    label: 'Journaling',
    description: 'Free-form journaling prompt',
    icon: PenLine,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    value: 'GOAL_SETTING',
    label: 'Goal Setting',
    description: 'Create or update goals',
    icon: Target,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    value: 'MINDFULNESS',
    label: 'Mindfulness',
    description: 'Meditation practice',
    icon: Sparkles,
    color: 'bg-pink-100 text-pink-600',
  },
] as const;

const CATEGORIES = [
  'Pre-Competition',
  'Post-Competition',
  'Recovery',
  'Goal Setting',
  'Team Building',
  'Stress Management',
  'Confidence Building',
  'Focus & Concentration',
  'Mental Resilience',
];

const SPORTS = [
  'All Sports',
  'Football',
  'Basketball',
  'Baseball',
  'Soccer',
  'Volleyball',
  'Track & Field',
  'Swimming',
  'Tennis',
  'Golf',
];

const YEARS = [
  'All Years',
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      difficulty: 'Medium',
      estimatedTime: 15,
      sportFilter: 'All Sports',
      yearFilter: 'All Years',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: AssignmentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Parse resources JSON if provided
      let resources = {};
      if (data.resources) {
        try {
          resources = JSON.parse(data.resources);
        } catch (e) {
          setError('Resources must be valid JSON');
          setIsSubmitting(false);
          return;
        }
      }

      // Convert "All Sports" / "All Years" to null
      const sportFilter = data.sportFilter === 'All Sports' ? null : data.sportFilter;
      const yearFilter = data.yearFilter === 'All Years' ? null : data.yearFilter;

      const response = await fetch('/api/coach/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          resources,
          sportFilter,
          yearFilter,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assignment');
      }

      const result = await response.json();

      // Redirect to assignments list with success message
      router.push(`/coach/assignments?success=created&assigned=${result.athletesAssigned}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Assignment</h1>
          <p className="text-gray-600 mt-2">
            Create a mental performance assignment for your athletes
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Assignment Type Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ASSIGNMENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setValue('type', type.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{type.label}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </button>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-red-600 text-sm mt-2">{errors.type.message}</p>
            )}
          </div>

          {/* Assignment Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Assignment Details</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="e.g., Pre-Game Visualization Exercise"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Brief overview of what this assignment covers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions *
              </label>
              <textarea
                {...register('instructions')}
                rows={6}
                placeholder="Step-by-step instructions for completing this assignment"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.instructions && (
                <p className="text-red-600 text-sm mt-1">{errors.instructions.message}</p>
              )}
            </div>

            {/* Resources (JSON) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resources (JSON format, optional)
              </label>
              <textarea
                {...register('resources')}
                rows={4}
                placeholder='{"videos": ["https://..."], "links": ["https://..."]}'
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-gray-500 text-sm mt-1">
                Provide links, videos, or other resources in JSON format
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty *
                </label>
                <select
                  {...register('difficulty')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time (minutes) *
                </label>
                <input
                  {...register('estimatedTime', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="300"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.estimatedTime && (
                  <p className="text-red-600 text-sm mt-1">{errors.estimatedTime.message}</p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  {...register('dueDate')}
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.dueDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.dueDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Target Audience</h2>
            <p className="text-gray-600 text-sm">
              Filter which athletes receive this assignment. Leave as "All" to assign to everyone.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sport Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport
                </label>
                <select
                  {...register('sportFilter')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SPORTS.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  {...register('yearFilter')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
