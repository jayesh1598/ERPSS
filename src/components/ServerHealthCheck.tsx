import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface ServerHealthCheckProps {
  onHealthy?: () => void;
  showAlways?: boolean;
}

export function ServerHealthCheck({ onHealthy, showAlways = false }: ServerHealthCheckProps) {
  // Health check disabled - always return healthy
  return null;
}