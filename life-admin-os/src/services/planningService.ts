import { Timestamp } from 'firebase/firestore';
import { isBefore, startOfDay, addDays, differenceInDays } from 'date-fns';

export type TaskRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const planningService = {
  calculatePlanningFields: (deadlineDate: Date | null, durationDays: number | null) => {
    if (!deadlineDate) {
      return { suggestedStartDate: null, bufferDays: 0, riskLevel: 'low' as TaskRiskLevel };
    }

    const today = startOfDay(new Date());
    const safeDuration = durationDays || 1;
    
    // max buffer = 5 days, buffer = 20%
    const calculatedBuffer = Math.min(5, Math.ceil(safeDuration * 0.2));
    
    // startDate = deadline - (duration + buffer)
    const totalDaysToSubtract = safeDuration + calculatedBuffer;
    const suggestedStartDate = addDays(deadlineDate, -totalDaysToSubtract);

    // Initial Risk calculation
    let riskLevel: TaskRiskLevel = 'low';
    const remainingTime = differenceInDays(deadlineDate, today);

    if (isBefore(deadlineDate, today) || remainingTime < 0) {
      riskLevel = 'high'; // Overdue
    } else if (isBefore(today, suggestedStartDate)) {
      riskLevel = 'low'; // Haven't reached start date
    } else if (!isBefore(today, suggestedStartDate) && remainingTime >= safeDuration) {
      riskLevel = 'medium'; // It's past start date, but we still have enough time to finish
    } else if (remainingTime < safeDuration) {
      riskLevel = 'critical'; // Math says it's impossible to finish on time
    }

    return {
      suggestedStartDate,
      bufferDays: calculatedBuffer,
      riskLevel
    };
  },

  calculateDynamicRisk: (deadlineDate: Date | null, suggestedStartDate: Date | null, durationDays: number): TaskRiskLevel => {
      // Calculates real-time risk based on current date
      if (!deadlineDate || !suggestedStartDate) return 'low';
      
      const today = startOfDay(new Date());
      const remainingTime = differenceInDays(deadlineDate, today);
      const safeDuration = durationDays || 1;

      if (isBefore(deadlineDate, today) || remainingTime < 0) {
        return 'high';
      }
      if (isBefore(today, suggestedStartDate)) {
        return 'low';
      }
      if (remainingTime < safeDuration) {
        return 'critical';
      }
      return 'medium';
  },

  detectConflicts: (
    newTaskStartDate: Date | null, 
    newTaskDeadline: Date | null, 
    allActiveTasks: { suggestedStartDate?: Timestamp | null, deadline?: Timestamp | null }[]
  ): boolean => {
     if (!newTaskStartDate || !newTaskDeadline) return false;

     let overlapCount = 0;
     for (const task of allActiveTasks) {
        if (!task.suggestedStartDate || !task.deadline) continue;
        
        const taskStart = new Date(task.suggestedStartDate.toMillis());
        const taskEnd = new Date(task.deadline.toMillis());

        // Check for overlap: A starts before B ends, and A ends after B starts
        if (newTaskStartDate <= taskEnd && newTaskDeadline >= taskStart) {
           overlapCount++;
        }
     }

     // If more than 3 tasks overlap in the exact same time window, flag as heavy conflict risk
     return overlapCount >= 3;
  }
};
