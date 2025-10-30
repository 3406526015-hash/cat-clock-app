import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, Trash2Icon, CalendarIcon, XIcon } from './icons';

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  dueDate?: string;
};

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
        const savedTodos = localStorage.getItem('todos');
        return savedTodos ? JSON.parse(savedTodos) : [];
    } catch (error) {
        console.error("无法解析本地存储中的待办事项:", error);
        return [];
    }
  });
  const [newTodo, setNewTodo] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const currentTodoIdForDate = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim() === '') return;
    setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
    setNewTodo('');
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  const handleCalendarClick = (id: number) => {
    currentTodoIdForDate.current = id;
    if (dateInputRef.current) {
        // For better UX, set the current value if it exists
        const currentTodo = todos.find(t => t.id === id);
        if (currentTodo?.dueDate) {
            dateInputRef.current.value = currentTodo.dueDate;
        } else {
            dateInputRef.current.value = '';
        }
        dateInputRef.current.click();
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentTodoIdForDate.current !== null) {
      const id = currentTodoIdForDate.current;
      const date = e.target.value;
      setTodos(
        todos.map(todo => (todo.id === id ? { ...todo, dueDate: date } : todo))
      );
      currentTodoIdForDate.current = null;
    }
  };
  
  const clearDueDate = (id: number) => {
      setTodos(
          todos.map(todo => {
              if (todo.id === id) {
                  const { dueDate, ...rest } = todo;
                  return rest;
              }
              return todo;
          })
      )
  }

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
  };
  
  return (
    <div className="w-full max-w-lg h-full flex flex-col">
        <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">我的待办事项</h2>
            <p className="text-slate-500 dark:text-slate-400">规划您的一天，保持专注。</p>
        </div>
        <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
            <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="添加新任务..."
            className="flex-grow p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
            type="submit"
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-orange-500 text-white rounded-md font-semibold hover:bg-orange-600 transition-colors disabled:bg-orange-300"
            disabled={!newTodo.trim()}
            aria-label="添加任务"
            >
            <PlusIcon className="w-6 h-6" />
            </button>
        </form>
        
        <input
            type="datetime-local"
            ref={dateInputRef}
            onChange={handleDateChange}
            className="hidden"
        />

        <ul className="space-y-3 overflow-y-auto flex-grow">
            {todos.length > 0 ? todos.map(todo => (
            <li
                key={todo.id}
                className="flex items-center w-full p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
            >
                <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="w-5 h-5 rounded text-orange-500 bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-orange-500 flex-shrink-0"
                />
                <div className={`ml-4 flex-grow ${
                    todo.completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'
                }`}>
                    <span className={todo.completed ? 'line-through' : ''}>
                        {todo.text}
                    </span>
                    {todo.dueDate && (
                        <div className="flex items-center gap-2">
                           <p className="text-xs text-orange-500 mt-1">{formatDueDate(todo.dueDate)}</p>
                           <button onClick={() => clearDueDate(todo.id)} className="text-slate-400 hover:text-red-500" aria-label="清除时间">
                               <XIcon className="w-3 h-3"/>
                           </button>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => handleCalendarClick(todo.id)}
                    className="ml-2 p-2 text-slate-400 hover:text-orange-500 rounded-full"
                    aria-label="设置待办时间"
                >
                    <CalendarIcon className="w-5 h-5" />
                </button>
                <button
                onClick={() => deleteTodo(todo.id)}
                className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-100/50 dark:hover:bg-red-900/50 rounded-full"
                aria-label="删除任务"
                >
                <Trash2Icon className="w-5 h-5" />
                </button>
            </li>
            )) : (
                <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400">还没有任务，开始添加吧！</p>
                </div>
            )}
        </ul>
    </div>
  );
};
export default TodoList;