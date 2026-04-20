import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task, taskService } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';

type TaskContextType = {
  tasks: Task[];
  loading: boolean;
};

export const TaskContext = createContext<TaskContextType>({ tasks: [], loading: true });

export const TaskProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(true);
      return;
    }

    // Fallback: If Firebase is unresponsive, clear loading after 4s
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    const unsubscribe = taskService.subscribeToTasks(user.uid, (data) => {
      clearTimeout(loadingTimeout);
      setTasks(data);
      setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [user]);

  return (
    <TaskContext.Provider value={{ tasks, loading }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
